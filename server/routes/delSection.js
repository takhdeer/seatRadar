const express = require('express')
const router = express.Router()
const pool = require('../db')

router.delete('/', async (req, res) => {
    const { userId, course } = req.query;
  
    if (!userId || !course) {
      return res.status(400).json({
        error: 'userId and course are required'
      });
    }
  
    try {
      const result = await pool.query(
        `DELETE FROM user_selected_sections
         WHERE user_id = $1 AND course = $2`,
        [userId, course]
      );
  
      return res.status(200).json({
        message: `Deleted saved sections for ${course}`,
        deletedCount: result.rowCount
      });
    } catch (err) {
      console.error('Failed to delete saved sections:', err);
      return res.status(500).json({ error: err.message });
    }
});

module.exports = router