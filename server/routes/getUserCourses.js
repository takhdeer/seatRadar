const express = require('express')
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
    const {userID} = req.query

    if (!userID) {
        console.log('User not found')
        return res.status(404).json({ error: 'User not found'} )
    }

    try{
        const result = await pool.query(
            `SELECT * FROM user_courses WHERE (user_id) = ($1)`, [userID]
        );
        const course = result.rows.map( row => {
            return {
                course: `${row.subject}${' '}${row.course_num}`
            };
        });
        
        return res.status(201).json(course) 

    } catch (err) {
        console.log(err)
        return res.status(500).json({error: 'Course not found for that user'})
    }
});

module.exports = router