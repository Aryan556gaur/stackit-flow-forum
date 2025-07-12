import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { executeQuery } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validation rules
const tagValidation = [
  body('name')
    .isLength({ min: 2, max: 20 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Tag name must be 2-20 characters, lowercase letters, numbers, and hyphens only'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters')
];

// Get all tags
router.get('/', async (req, res) => {
  try {
    const result = await executeQuery(
      'SELECT id, name, description, count, created_at FROM tags ORDER BY count DESC, name ASC'
    );

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tags'
    });
  }
});

// Get popular tags
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await executeQuery(
      'SELECT id, name, description, count FROM tags ORDER BY count DESC LIMIT ?',
      [parseInt(limit)]
    );

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get popular tags error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular tags'
    });
  }
});

// Get tag by name
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;

    const result = await executeQuery(
      'SELECT id, name, description, count, created_at FROM tags WHERE name = ?',
      [name]
    );

    if (!result.success || result.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }

    res.json({
      success: true,
      data: result.data[0]
    });
  } catch (error) {
    console.error('Get tag error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tag'
    });
  }
});

// Create new tag
router.post('/', verifyToken, tagValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, description } = req.body;

    // Check if tag already exists
    const existingResult = await executeQuery(
      'SELECT id FROM tags WHERE name = ?',
      [name]
    );

    if (existingResult.success && existingResult.data.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Tag already exists'
      });
    }

    // Create tag
    const tagId = uuidv4();
    const createResult = await executeQuery(
      'INSERT INTO tags (id, name, description, count) VALUES (?, ?, ?, ?)',
      [tagId, name, description || '', 0]
    );

    if (!createResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create tag'
      });
    }

    // Get created tag
    const tagResult = await executeQuery(
      'SELECT id, name, description, count, created_at FROM tags WHERE id = ?',
      [tagId]
    );

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: tagResult.data[0]
    });
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create tag'
    });
  }
});

// Update tag
router.put('/:id', verifyToken, tagValidation, async (req, res) => {
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
    const { name, description } = req.body;

    // Check if tag exists
    const existingResult = await executeQuery(
      'SELECT id FROM tags WHERE id = ?',
      [id]
    );

    if (!existingResult.success || existingResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }

    // Check if new name already exists (if name is being updated)
    if (name) {
      const nameExistsResult = await executeQuery(
        'SELECT id FROM tags WHERE name = ? AND id != ?',
        [name, id]
      );

      if (nameExistsResult.success && nameExistsResult.data.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Tag name already exists'
        });
      }
    }

    // Update tag
    const updateResult = await executeQuery(
      'UPDATE tags SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?',
      [name, description, id]
    );

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update tag'
      });
    }

    res.json({
      success: true,
      message: 'Tag updated successfully'
    });
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tag'
    });
  }
});

// Delete tag (only if not used by any questions)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tag is used by any questions
    const usageResult = await executeQuery(
      'SELECT COUNT(*) as count FROM question_tags WHERE tag_id = ?',
      [id]
    );

    if (usageResult.success && usageResult.data[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete tag that is used by questions'
      });
    }

    // Delete tag
    const deleteResult = await executeQuery(
      'DELETE FROM tags WHERE id = ?',
      [id]
    );

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete tag'
      });
    }

    res.json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete tag'
    });
  }
});

// Get questions by tag
router.get('/:name/questions', async (req, res) => {
  try {
    const { name } = req.params;
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
       JOIN question_tags qt ON q.id = qt.question_id
       JOIN tags t ON qt.tag_id = t.id
       WHERE t.name = ?
       GROUP BY q.id
       ORDER BY q.created_at DESC
       LIMIT ? OFFSET ?`,
      [name, parseInt(limit), offset]
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
    console.error('Get questions by tag error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions by tag'
    });
  }
});

export default router; 