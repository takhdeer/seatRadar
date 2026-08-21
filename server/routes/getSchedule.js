const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
    const { subject, courseNum } = req.query

    if (!subject || !courseNum) {
        console.log('No course to track')
        return res.status(401).json( {error: 'Invalid Course Credentails'})
    }

    try {
        const result = await pool.query(
            `SELECT * FROM tracked_courses WHERE (subject, course_num) = ($1,$2)`,
            [subject,courseNum]
        );
        const id = result.rows[0].id
        const term = result.rows[0].term
        
        const result2 = await pool.query(
            `SELECT * FROM course_data WHERE (tracked_courses_id) = ($1)`, [id]
        );
        const scheduleData = result2.rows.map( row => {
            return {
                subject: subject,
                courseNum: courseNum,
                term: term,
                section: row.section_id,
                days: row.days,
                start: row.start_time,
                end: row.end_time
            };
        });
        
        if (scheduleData.length === 0) {
            console.log('Schedule not stored')
            return res.status(404).json({ error: 'Schedule not found'})
        }
        
        console.log(scheduleData)
        return res.status(200).json({scheduleData})
    } catch (err) {
        console.log(err)
        return res.status(404).json({ error: 'Schedule data not found'})
    }
});

module.exports = router