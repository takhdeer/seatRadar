const express = require('express');
const router = express.Router();
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth')

router.post('/', requireAuth, async (req, res) => {
    const userID = req.user.id

    console.log(req.body);
    const {subject, courseNum, termCode } = req.body;

    if (!subject || !courseNum || !termCode) {
        return res.status(400).json({ error: "Missing Fields"});
    }

    try{
        await pool.query(
            'INSERT INTO tracked_courses (user_id, subject, course_num, term) VALUES ($1,$2,$3,$4)', [userID,subject,courseNum,termCode]
        );
        return res.json({message: "Courses added sucessfully!"})
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error"})
    }
});

module.exports = router;