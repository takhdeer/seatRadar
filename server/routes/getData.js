const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req,res) => {
    const { subject, courseNum } = req.query

    if (!subject || !courseNum) {
        console.log('No course to track')
        return res.status(401).json( {error: 'Invalid Course Credentails'})
    }

    try {
        const result = await pool.query(
            'SELECT * FROM tracked_courses WHERE (subject, course_num) = ($1,$2)', [subject,courseNum]
        );
        const id = result.rows[0].id
        console.log(`Course ID: ${id}`)

        const result2 = await pool.query(
            `SELECT * FROM course_data WHERE (tracked_courses_id) = ($1)`, [id]
        );
        
        const courseData = result2.rows.map( row => {
            return {
                seats: row.seats,
                total_seats: row.total_seats,
                waitlist: row.waitlist,
                checked: row.last_checked,
                id: id
            };
        });

        if (courseData.length === 0) {
            console.log('Data not stored')
            return res.status(404).json({ error: 'Course Data not found'})
        }

        console.log(courseData)
        return res.status(201).json({ message: 'Course Data was found', courseData})

    } catch (err) {
        console.log(err)
        return res.status(404).json({ error: 'Course Data not found'})
    }

})

module.exports= router