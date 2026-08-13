const express = require('express');
const router = express.Router();
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth')

router.post('/', requireAuth, async (req, res) => {
    const userID = req.user.id
    let courseID

    console.log(req.body);
    const {subject, courseNum, termCode } = req.body;

    if (!subject || !courseNum || !termCode) {
        return res.status(400).json({ error: "Missing Fields"});
    }

    try {
        const res1 = await pool.query(
            'INSERT INTO tracked_courses (subject, course_num, term) VALUES ($1,$2,$3) RETURNING id', [subject,courseNum,termCode]
        );
        const newId = res1.rows[0].id;
        courseID = newId
    } catch(err) {

        if (err.code === '23505') {
            const res2 = await pool.query(
                'SELECT id FROM tracked_courses WHERE (subject, course_num, term) = ($1,$2,$3)', [subject,courseNum,termCode]
            )
            courseID = res2.rows[0].id;
        }
        else {    
            console.log(err);
            res.status(500).json({ error: 'Databse error in table tracked_courses'})
        }

    }
    try{
        await pool.query(
            'INSERT INTO user_courses (user_id, course_id, subject, course_num, term) VALUES ($1,$2,$3,$4,$5)', [userID,courseID,subject,courseNum,termCode]
        );
        return res.json({message: "Courses added sucessfully!"})
    } catch (err) {
        if (err.code === '23505') {
            console.log('User is already tracking this course')
            res.status(409).json({ error: 'User is already tracking this course'})
        }
        else {    
            console.error(err);
            return res.status(500).json({ error: "Database error in table user_courses"})
        }
    }
});

module.exports = router;