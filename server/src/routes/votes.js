import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { executeQuery } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validation rules
const voteValidation = [
  body('targetId')
    .notEmpty()
    .withMessage('Target ID is required'),
  body('targetType')
    .isIn(['question', 'answer'])
    .withMessage('Target type must be either "question" or "answer"'),
  body('value')
    .isIn([1, -1])
    .withMessage('Vote value must be either 1 (upvote) or -1 (downvote)')
];

// Vote on question or answer
router.post('/', verifyToken, voteValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { targetId, targetType, value } = req.body;
    const userId = req.user.id;

    // Check if target exists
    let targetExists = false;
    if (targetType === 'question') {
      const questionResult = await executeQuery(
        'SELECT id, author_id FROM questions WHERE id = ?',
        [targetId]
      );
      targetExists = questionResult.success && questionResult.data.length > 0;
    } else {
      const answerResult = await executeQuery(
        'SELECT id, author_id FROM answers WHERE id = ?',
        [targetId]
      );
      targetExists = answerResult.success && answerResult.data.length > 0;
    }

    if (!targetExists) {
      return res.status(404).json({
        success: false,
        error: `${targetType} not found`
      });
    }

    // Check if user is voting on their own content
    const targetAuthorResult = await executeQuery(
      targetType === 'question' 
        ? 'SELECT author_id FROM questions WHERE id = ?'
        : 'SELECT author_id FROM answers WHERE id = ?',
      [targetId]
    );

    if (targetAuthorResult.success && targetAuthorResult.data[0].author_id === userId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot vote on your own content'
      });
    }

    // Check if user already voted
    const existingVoteResult = await executeQuery(
      'SELECT id, value FROM votes WHERE user_id = ? AND target_id = ? AND target_type = ?',
      [userId, targetId, targetType]
    );

    if (existingVoteResult.success && existingVoteResult.data.length > 0) {
      const existingVote = existingVoteResult.data[0];
      
      if (existingVote.value === value) {
        // Remove vote if same value
        await executeQuery(
          'DELETE FROM votes WHERE id = ?',
          [existingVote.id]
        );

        // Update target vote count
        await executeQuery(
          `UPDATE ${targetType}s SET votes = votes - ? WHERE id = ?`,
          [value, targetId]
        );

        // Update user reputation if voting on answer
        if (targetType === 'answer') {
          const answerAuthorResult = await executeQuery(
            'SELECT author_id FROM answers WHERE id = ?',
            [targetId]
          );
          if (answerAuthorResult.success && answerAuthorResult.data.length > 0) {
            await executeQuery(
              'UPDATE users SET reputation = reputation - ? WHERE id = ?',
              [value, answerAuthorResult.data[0].author_id]
            );
          }
        }

        res.json({
          success: true,
          message: 'Vote removed',
          data: { action: 'removed' }
        });
      } else {
        // Change vote
        await executeQuery(
          'UPDATE votes SET value = ? WHERE id = ?',
          [value, existingVote.id]
        );

        // Update target vote count (remove old vote, add new vote)
        await executeQuery(
          `UPDATE ${targetType}s SET votes = votes - ? + ? WHERE id = ?`,
          [existingVote.value, value, targetId]
        );

        // Update user reputation if voting on answer
        if (targetType === 'answer') {
          const answerAuthorResult = await executeQuery(
            'SELECT author_id FROM answers WHERE id = ?',
            [targetId]
          );
          if (answerAuthorResult.success && answerAuthorResult.data.length > 0) {
            await executeQuery(
              'UPDATE users SET reputation = reputation - ? + ? WHERE id = ?',
              [existingVote.value, value, answerAuthorResult.data[0].author_id]
            );
          }
        }

        res.json({
          success: true,
          message: 'Vote updated',
          data: { action: 'updated', value }
        });
      }
    } else {
      // Create new vote
      const voteId = uuidv4();
      await executeQuery(
        'INSERT INTO votes (id, user_id, target_id, target_type, value) VALUES (?, ?, ?, ?, ?)',
        [voteId, userId, targetId, targetType, value]
      );

      // Update target vote count
      await executeQuery(
        `UPDATE ${targetType}s SET votes = votes + ? WHERE id = ?`,
        [value, targetId]
      );

      // Update user reputation if voting on answer
      if (targetType === 'answer') {
        const answerAuthorResult = await executeQuery(
          'SELECT author_id FROM answers WHERE id = ?',
          [targetId]
        );
        if (answerAuthorResult.success && answerAuthorResult.data.length > 0) {
          await executeQuery(
            'UPDATE users SET reputation = reputation + ? WHERE id = ?',
            [value, answerAuthorResult.data[0].author_id]
          );
        }
      }

      res.json({
        success: true,
        message: 'Vote recorded',
        data: { action: 'created', value }
      });
    }
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record vote'
    });
  }
});

// Get vote count for a target
router.get('/:targetType/:targetId', async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    if (!['question', 'answer'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid target type'
      });
    }

    const result = await executeQuery(
      `SELECT votes FROM ${targetType}s WHERE id = ?`,
      [targetId]
    );

    if (!result.success || result.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: `${targetType} not found`
      });
    }

    res.json({
      success: true,
      data: {
        targetId,
        targetType,
        votes: result.data[0].votes
      }
    });
  } catch (error) {
    console.error('Get vote count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get vote count'
    });
  }
});

// Get user's vote on a target (if authenticated)
router.get('/:targetType/:targetId/user', verifyToken, async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const userId = req.user.id;

    if (!['question', 'answer'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid target type'
      });
    }

    const result = await executeQuery(
      'SELECT value FROM votes WHERE user_id = ? AND target_id = ? AND target_type = ?',
      [userId, targetId, targetType]
    );

    res.json({
      success: true,
      data: {
        targetId,
        targetType,
        userVote: result.success && result.data.length > 0 ? result.data[0].value : null
      }
    });
  } catch (error) {
    console.error('Get user vote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user vote'
    });
  }
});

export default router; 