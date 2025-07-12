import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { executeQuery } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validation rules
const answerValidation = [
  body('content')
    .isLength({ min: 20 })
    .withMessage('Content must be at least 20 characters')
];

// Get answers for a question
router.get('/question/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;

    const result = await executeQuery(
      `SELECT 
        a.id, a.content, a.author_id, a.votes, a.is_accepted, 
        a.created_at, a.updated_at,
        u.username as author_username, u.avatar as author_avatar, u.reputation as author_reputation
       FROM answers a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.question_id = ?
       ORDER BY a.is_accepted DESC, a.votes DESC, a.created_at ASC`,
      [questionId]
    );

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get answers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch answers'
    });
  }
});

// Create new answer
router.post('/', verifyToken, answerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { questionId, content } = req.body;
    const authorId = req.user.id;
    const answerId = uuidv4();

    // Check if question exists
    const questionResult = await executeQuery(
      'SELECT id FROM questions WHERE id = ?',
      [questionId]
    );

    if (!questionResult.success || questionResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    // Create answer
    const createResult = await executeQuery(
      'INSERT INTO answers (id, content, author_id, question_id) VALUES (?, ?, ?, ?)',
      [answerId, content, authorId, questionId]
    );

    if (!createResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create answer'
      });
    }

    // Get created answer with author info
    const answerResult = await executeQuery(
      `SELECT 
        a.id, a.content, a.author_id, a.votes, a.is_accepted, 
        a.created_at, a.updated_at,
        u.username as author_username, u.avatar as author_avatar, u.reputation as author_reputation
       FROM answers a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.id = ?`,
      [answerId]
    );

    res.status(201).json({
      success: true,
      message: 'Answer created successfully',
      data: answerResult.data[0]
    });
  } catch (error) {
    console.error('Create answer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create answer'
    });
  }
});

// Update answer
router.put('/:id', verifyToken, answerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Check ownership
    const ownershipResult = await executeQuery(
      'SELECT author_id FROM answers WHERE id = ?',
      [id]
    );

    if (!ownershipResult.success || ownershipResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Answer not found'
      });
    }

    if (ownershipResult.data[0].author_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own answers'
      });
    }

    // Update answer
    const updateResult = await executeQuery(
      'UPDATE answers SET content = ?, updated_at = NOW() WHERE id = ?',
      [content, id]
    );

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update answer'
      });
    }

    res.json({
      success: true,
      message: 'Answer updated successfully'
    });
  } catch (error) {
    console.error('Update answer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update answer'
    });
  }
});

// Delete answer
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const ownershipResult = await executeQuery(
      'SELECT author_id FROM answers WHERE id = ?',
      [id]
    );

    if (!ownershipResult.success || ownershipResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Answer not found'
      });
    }

    if (ownershipResult.data[0].author_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own answers'
      });
    }

    // Delete answer
    const deleteResult = await executeQuery(
      'DELETE FROM answers WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Answer deleted successfully'
    });
  } catch (error) {
    console.error('Delete answer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete answer'
    });
  }
});

// Accept answer
router.post('/:id/accept', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get answer with question info
    const answerResult = await executeQuery(
      `SELECT a.*, q.author_id as question_author_id 
       FROM answers a 
       JOIN questions q ON a.question_id = q.id 
       WHERE a.id = ?`,
      [id]
    );

    if (!answerResult.success || answerResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Answer not found'
      });
    }

    const answer = answerResult.data[0];

    // Check if user owns the question
    if (answer.question_author_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only accept answers to your own questions'
      });
    }

    // Unaccept all other answers for this question
    await executeQuery(
      'UPDATE answers SET is_accepted = FALSE WHERE question_id = ?',
      [answer.question_id]
    );

    // Accept the selected answer
    await executeQuery(
      'UPDATE answers SET is_accepted = TRUE WHERE id = ?',
      [id]
    );

    // Mark question as answered
    await executeQuery(
      'UPDATE questions SET is_answered = TRUE WHERE id = ?',
      [answer.question_id]
    );

    res.json({
      success: true,
      message: 'Answer accepted successfully'
    });
  } catch (error) {
    console.error('Accept answer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept answer'
    });
  }
});

export default router; 