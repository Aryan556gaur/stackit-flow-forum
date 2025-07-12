import express from 'express';
import { verifyToken, optionalAuth } from '../middleware/auth.js';
import { executeQuery } from '../config/database.js';

const router = express.Router();

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery(
      `SELECT 
        id, username, email, avatar, bio, reputation, 
        created_at, updated_at,
        (SELECT COUNT(*) FROM questions WHERE author_id = users.id) as question_count,
        (SELECT COUNT(*) FROM answers WHERE author_id = users.id) as answer_count
       FROM users 
       WHERE id = ?`,
      [id]
    );

    if (!result.success || result.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.data[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

// Get user questions
router.get('/:id/questions', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await executeQuery(
      `SELECT 
        q.id, q.title, q.content, q.author_id, q.votes, q.views, 
        q.is_answered, q.created_at, q.updated_at,
        u.username as author_username, u.avatar as author_avatar, u.reputation as author_reputation,
        COUNT(DISTINCT a.id) as answer_count
       FROM questions q
       LEFT JOIN users u ON q.author_id = u.id
       LEFT JOIN answers a ON q.id = a.question_id
       WHERE q.author_id = ?
       GROUP BY q.id
       ORDER BY q.created_at DESC
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), offset]
    );

    // Get tags for each question
    const questionsWithTags = await Promise.all(
      result.data.map(async (question) => {
        const tagsResult = await executeQuery(
          `SELECT t.name 
           FROM question_tags qt 
           JOIN tags t ON qt.tag_id = t.id 
           WHERE qt.question_id = ?`,
          [question.id]
        );

        return {
          ...question,
          tags: tagsResult.success ? tagsResult.data.map(t => t.name) : []
        };
      })
    );

    res.json({
      success: true,
      data: questionsWithTags,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: questionsWithTags.length
      }
    });
  } catch (error) {
    console.error('Get user questions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user questions'
    });
  }
});

// Get user answers
router.get('/:id/answers', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await executeQuery(
      `SELECT 
        a.id, a.content, a.author_id, a.votes, a.is_accepted, 
        a.created_at, a.updated_at,
        u.username as author_username, u.avatar as author_avatar, u.reputation as author_reputation,
        q.id as question_id, q.title as question_title
       FROM answers a
       LEFT JOIN users u ON a.author_id = u.id
       LEFT JOIN questions q ON a.question_id = q.id
       WHERE a.author_id = ?
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.data.length
      }
    });
  } catch (error) {
    console.error('Get user answers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user answers'
    });
  }
});

// Get user votes
router.get('/:id/votes', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    // Users can only see their own votes
    if (id !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own votes'
      });
    }

    const result = await executeQuery(
      `SELECT 
        v.id, v.target_id, v.target_type, v.value, v.created_at,
        CASE 
          WHEN v.target_type = 'question' THEN q.title
          WHEN v.target_type = 'answer' THEN a.content
        END as target_content
       FROM votes v
       LEFT JOIN questions q ON v.target_type = 'question' AND v.target_id = q.id
       LEFT JOIN answers a ON v.target_type = 'answer' AND v.target_id = a.id
       WHERE v.user_id = ?
       ORDER BY v.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get user votes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user votes'
    });
  }
});

// Get user reputation history
router.get('/:id/reputation', async (req, res) => {
  try {
    const { id } = req.params;

    // This is a simplified version. In a real app, you'd have a reputation_history table
    const result = await executeQuery(
      `SELECT 
        'question_vote' as type,
        q.title as description,
        v.value as points,
        v.created_at as date
       FROM votes v
       JOIN questions q ON v.target_id = q.id
       WHERE v.target_type = 'question' AND q.author_id = ? AND v.user_id != ?
       
       UNION ALL
       
       SELECT 
        'answer_vote' as type,
        q.title as description,
        v.value as points,
        v.created_at as date
       FROM votes v
       JOIN answers a ON v.target_id = a.id
       JOIN questions q ON a.question_id = q.id
       WHERE v.target_type = 'answer' AND a.author_id = ? AND v.user_id != ?
       
       ORDER BY date DESC
       LIMIT 50`,
      [id, id, id, id]
    );

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get user reputation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user reputation'
    });
  }
});

// Search users
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;

    const result = await executeQuery(
      `SELECT 
        id, username, avatar, bio, reputation, created_at,
        (SELECT COUNT(*) FROM questions WHERE author_id = users.id) as question_count,
        (SELECT COUNT(*) FROM answers WHERE author_id = users.id) as answer_count
       FROM users 
       WHERE username LIKE ? OR bio LIKE ?
       ORDER BY reputation DESC, username ASC
       LIMIT ?`,
      [`%${query}%`, `%${query}%`, parseInt(limit)]
    );

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
});

// Get top users by reputation
router.get('/top/reputation', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await executeQuery(
      `SELECT 
        id, username, avatar, bio, reputation, created_at,
        (SELECT COUNT(*) FROM questions WHERE author_id = users.id) as question_count,
        (SELECT COUNT(*) FROM answers WHERE author_id = users.id) as answer_count
       FROM users 
       ORDER BY reputation DESC
       LIMIT ?`,
      [parseInt(limit)]
    );

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get top users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top users'
    });
  }
});

// Get user statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const statsResult = await executeQuery(
      `SELECT 
        (SELECT COUNT(*) FROM questions WHERE author_id = ?) as question_count,
        (SELECT COUNT(*) FROM answers WHERE author_id = ?) as answer_count,
        (SELECT COUNT(*) FROM votes WHERE user_id = ?) as vote_count,
        (SELECT COUNT(*) FROM questions WHERE author_id = ? AND is_answered = TRUE) as answered_questions,
        (SELECT COUNT(*) FROM answers WHERE author_id = ? AND is_accepted = TRUE) as accepted_answers,
        (SELECT reputation FROM users WHERE id = ?) as reputation`,
      [id, id, id, id, id, id]
    );

    if (!statsResult.success || statsResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: statsResult.data[0]
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics'
    });
  }
});

export default router; 