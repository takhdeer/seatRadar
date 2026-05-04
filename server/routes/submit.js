const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
    console.log(req.body);
    const { email, crn, term } = req.body;

    if (!email || !crn || !term) {
        return res.status(400).json({ error: "Missing Fields"});
    }

    try{
        await pool.query(
            'INSERT INTO tracked_courses (user_email, course_crn, term) VALUES ($1,$2,$3)', [email,crn,term]
        );
        res.json({message: "Courses added sucessfully!"})
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error"})
    }
});

module.exports = router;