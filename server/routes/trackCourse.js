const express = require('express')
const router = express.Router();
const pool = require('../db')
const requireAuth = require('../middleware/requireAuth')

router.post('/', async (req,res) => {
    console.log(req.body)
    const {courseData} = req.body

    if (!courseData) {
        return res.status(400).json({error: 'Missing Fields'})
    }

    for (let i = 0; i < courseData.totalCount; i++) {
        try {
            await pool.query(
                `INSERT INTO course_data (total_count,seats,waitlist) VALUES ($1,$2,$3)`, [courseData.totalCount,courseData[`seatsAvailableS${i + 1}`],courseData[`waitAvailableS${i + 1}`]]
            );
            console.log('Course Saved in database');
        } catch (err) {
            console.log(err);
        }
    }
}); 

module.exports = router