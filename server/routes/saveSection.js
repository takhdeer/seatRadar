const express = require('express')
const router = express.Router()
const pool = require('../db')

router.post('/', async (req,res) => {
    const {userId, course, sectionIds} = req.body

    if (!userId || !course || !sectionIds) {
        console.log('Insufficient Credentials')
        return res.status(404).json({ error: 'Insufficent Credentials'})
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
          'DELETE FROM user_selected_sections WHERE user_id = $1 AND course = $2',
          [userId, course]
        );
        for (const sectionId of sectionIds) {
          await client.query(
            'INSERT INTO user_selected_sections (user_id, course, section_id) VALUES ($1, $2, $3)',
            [userId, course, sectionId]
          );
        }
        await client.query('COMMIT');
        console.log('Section Saved')
        return res.json({ message: `Saved Sections for ${course}` });
      } catch (err) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: err.message });
      } finally {
        client.release();
      }
});

router.get('/', async (req, res) => {
    const { userId } = req.query;
  
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
  
    try {
      const result = await pool.query(
        `SELECT 
           uss.course,
           uss.section_id,
           cd.days,
           cd.start_time,
           cd.end_time,
           cd.class_type
         FROM user_selected_sections uss
         JOIN tracked_courses tc
           ON tc.subject = split_part(uss.course, ' ', 1)
           AND tc.course_num = split_part(uss.course, ' ', 2)
         JOIN course_data cd
           ON cd.tracked_courses_id = tc.id
           AND cd.section_id = uss.section_id
         WHERE uss.user_id = $1`,
        [userId]
      );
  
      return res.json(result.rows);
    } catch (err) {
      console.error('Error fetching selected sections:', err);
      return res.status(500).json({ error: 'Failed to load saved schedule' });
    }
  });

module.exports = router