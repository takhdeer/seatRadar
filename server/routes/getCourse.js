const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req,res) => {
    const { courseID} = req.query

    if (!courseID || courseID.length === 0) {
        console.log('Course ID invalid')
        return res.status(404).json( {error: 'Course ID not found or Invalid'})
    }

    try { 
        const result = await pool.query(
            'SELECT * FROM tracked_courses WHERE (id) = ($1)', [courseID]
        );
        const subject = result.rows[0].subject
        const courseNum = result.rows[0].course_num
        console.log(subject,courseNum)
        return res.json({message: 'Subject and CourseNumber found'})

    }catch (err) {
        console.log(err)
        return res.status(404).json({ error: 'Course Not found'})
    }
})

module.exports = router
