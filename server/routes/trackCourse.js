const express = require('express')
const router = express.Router();
const pool = require('../db')

router.post('/', async (req,res) => {
    console.log(req.body)
    const {courseData, subject, courseNum} = req.body

    if (!courseData || !subject || !courseNum) {
        return res.status(400).json({error: 'Missing Fields'})
    }

    const result = await pool.query(
        'SELECT * FROM tracked_courses WHERE (subject, course_num) = ($1,$2)', [subject,courseNum]
    );
    const id = result.rows[0].id
    console.log(`Course ID: ${id}`)
    

    for (let i = 0; i < courseData.totalCount; i++) {
        try {
            await pool.query(
                `INSERT INTO course_data (tracked_courses_id,total_count,seats,waitlist) VALUES ($1,$2,$3,$4)`, [id,courseData.totalCount,courseData[`seatsAvailableS${i + 1}`],courseData[`waitAvailableS${i + 1}`]]
            );
            console.log('Course Saved in database');
        } catch (err) {
            console.log(err);
        }
    }

    return res.status(201).json({ message: 'Course data saved successfully'})
}); 

module.exports = router