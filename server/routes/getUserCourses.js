const express = require('express')
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
    const {userEmail} = req.query

    if (!userEmail) {
        console.log('User not found')
        return res.status(404).json({ error: 'User not found'} )
    }

    try{
        const result = await pool.query(
            `SELECT uc.* FROM users u 
            JOIN user_courses uc ON u.id = uc.user_id 
            WHERE u.user_email = $1`, [userEmail]
        );
        const course = result.rows.map( row => {
            return {
                course: `${row.subject}${' '}${row.course_num}`,
                term: row.term
            };
        });
        
        return res.status(201).json(course) 

    } catch (err) {
        console.log(err)
        return res.status(500).json({error: 'Course not found for that user'})
    }
});

module.exports = router