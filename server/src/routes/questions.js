import express from 'express';
import { verifyToken, optionalAuth } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { executeQuery } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validation rules
const questionValidation = [
  body('title')
    .isLength({ min: 10, max: 500 })
    .withMessage('Title must be between 10 and 500 characters'),
  body('content')
    .isLength({ min: 20 })
    .withMessage('Content must be at least 20 characters'),
  body('tags')
    .isArray({ min: 1, max: 5 })
    .withMessage('Must include 1-5 tags')
];

// Get all questions with optional filters
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { tag, search, sort = 'newest', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        q.id, q.title, q.content, q.author_id, q.votes, q.views, 
        q.is_answered, q.created_at, q.updated_at,
        u.username as author_username, u.avatar as author_avatar, u.reputation as author_reputation,
        COUNT(DISTINCT a.id) as answer_count
      FROM questions q
      LEFT JOIN users u ON q.author_id = u.id
      LEFT JOIN answers a ON q.id = a.question_id
    `;

    const whereConditions = [];
    const params = [];

    // Add search filter
    if (search) {
      whereConditions.push('(q.title LIKE ? OR q.content LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // Add tag filter
    if (tag) {
      query += `
        LEFT JOIN question_tags qt ON q.id = qt.question_id
        LEFT JOIN tags t ON qt.tag_id = t.id
      `;
      whereConditions.push('t.name = ?');
      params.push(tag);
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    query += ' GROUP BY q.id';

    // Add sorting
    switch (sort) {
      case 'votes':
        query += ' ORDER BY q.votes DESC';
        break;
      case 'views':
        query += ' ORDER BY q.views DESC';
        break;
      case 'newest':
      default:
        query += ' ORDER BY q.created_at DESC';
        break;
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const result = await executeQuery(query, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch questions'
      });
    }

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
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    });
  }
});

// Get single question by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Increment view count
    await executeQuery(
      'UPDATE questions SET views = views + 1 WHERE id = ?',
      [id]
    );

    // Get question with author info
    const questionResult = await executeQuery(
      `SELECT 
        q.id, q.title, q.content, q.author_id, q.votes, q.views, 
        q.is_answered, q.created_at, q.updated_at,
        u.username as author_username, u.avatar as author_avatar, u.reputation as author_reputation
       FROM questions q
       LEFT JOIN users u ON q.author_id = u.id
       WHERE q.id = ?`,
      [id]
    );

    if (!questionResult.success || questionResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    const question = questionResult.data[0];

    // Get tags
    const tagsResult = await executeQuery(
      `SELECT t.name 
       FROM question_tags qt 
       JOIN tags t ON qt.tag_id = t.id 
       WHERE qt.question_id = ?`,
      [id]
    );

    // Get answers
    const answersResult = await executeQuery(
      `SELECT 
        a.id, a.content, a.author_id, a.votes, a.is_accepted, 
        a.created_at, a.updated_at,
        u.username as author_username, u.avatar as author_avatar, u.reputation as author_reputation
       FROM answers a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.question_id = ?
       ORDER BY a.is_accepted DESC, a.votes DESC, a.created_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...question,
        tags: tagsResult.success ? tagsResult.data.map(t => t.name) : [],
        answers: answersResult.success ? answersResult.data : []
      }
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch question'
    });
  }
});

// Create new question
router.post('/', verifyToken, questionValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { title, content, tags } = req.body;
    const authorId = req.user.id;
    const questionId = uuidv4();

    // Create question
    const createQuestionResult = await executeQuery(
      'INSERT INTO questions (id, title, content, author_id) VALUES (?, ?, ?, ?)',
      [questionId, title, content, authorId]
    );

    if (!createQuestionResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create question'
      });
    }

    // Add tags
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // Get or create tag
        let tagResult = await executeQuery(
          'SELECT id FROM tags WHERE name = ?',
          [tagName]
        );

        let tagId;
        if (tagResult.success && tagResult.data.length > 0) {
          tagId = tagResult.data[0].id;
        } else {
          // Create new tag
          tagId = uuidv4();
          await executeQuery(
            'INSERT INTO tags (id, name, description) VALUES (?, ?, ?)',
            [tagId, tagName, `Tag for ${tagName}`]
          );
        }

        // Link tag to question
        await executeQuery(
          'INSERT INTO question_tags (question_id, tag_id) VALUES (?, ?)',
          [questionId, tagId]
        );

        // Update tag count
        await executeQuery(
          'UPDATE tags SET count = (SELECT COUNT(*) FROM question_tags WHERE tag_id = ?) WHERE id = ?',
          [tagId, tagId]
        );
      }
    }

    // Get created question with full data
    const questionResult = await executeQuery(
      `SELECT 
        q.id, q.title, q.content, q.author_id, q.votes, q.views, 
        q.is_answered, q.created_at, q.updated_at,
        u.username as author_username, u.avatar as author_avatar, u.reputation as author_reputation
       FROM questions q
       LEFT JOIN users u ON q.author_id = u.id
       WHERE q.id = ?`,
      [questionId]
    );

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: {
        ...questionResult.data[0],
        tags: tags || []
      }
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create question'
    });
  }
});

// Update question
router.put('/:id', verifyToken, questionValidation, async (req, res) => {
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
    const { title, content, tags } = req.body;
    const userId = req.user.id;

    // Check ownership
    const ownershipResult = await executeQuery(
      'SELECT author_id FROM questions WHERE id = ?',
      [id]
    );

    if (!ownershipResult.success || ownershipResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    if (ownershipResult.data[0].author_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own questions'
      });
    }

    // Update question
    const updateResult = await executeQuery(
      'UPDATE questions SET title = ?, content = ?, updated_at = NOW() WHERE id = ?',
      [title, content, id]
    );

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update question'
      });
    }

    // Update tags if provided
    if (tags) {
      // Remove existing tags
      await executeQuery('DELETE FROM question_tags WHERE question_id = ?', [id]);

      // Add new tags
      for (const tagName of tags) {
        let tagResult = await executeQuery(
          'SELECT id FROM tags WHERE name = ?',
          [tagName]
        );

        let tagId;
        if (tagResult.success && tagResult.data.length > 0) {
          tagId = tagResult.data[0].id;
        } else {
          tagId = uuidv4();
          await executeQuery(
            'INSERT INTO tags (id, name, description) VALUES (?, ?, ?)',
            [tagId, tagName, `Tag for ${tagName}`]
          );
        }

        await executeQuery(
          'INSERT INTO question_tags (question_id, tag_id) VALUES (?, ?)',
          [id, tagId]
        );
      }
    }

    res.json({
      success: true,
      message: 'Question updated successfully'
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update question'
    });
  }
});

// Delete question
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const ownershipResult = await executeQuery(
      'SELECT author_id FROM questions WHERE id = ?',
      [id]
    );

    if (!ownershipResult.success || ownershipResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    if (ownershipResult.data[0].author_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own questions'
      });
    }

    // Delete question (cascade will handle related data)
    const deleteResult = await executeQuery(
      'DELETE FROM questions WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete question'
    });
  }
});

export default router; 