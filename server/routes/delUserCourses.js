const express = require('express')
const router = express.Router()
const pool = require('../db')

router.delete('/', async (req,res) => {
    const { subject, courseNum, term } = req.query

    if (!subject || !courseNum || !term) {
        console.log('Invalid Credential requst')
        return res.status(401).json( {error: 'Invalid Course Credentials'})
    }

    try {
        await pool.query(
            `DELETE FROM user_courses WHERE (subject, course_num, term) = ($1,$2,$3)`,
            [subject,courseNum,term]
        )
        console.log(`User is no longer tracking ${subject} ${courseNum} in ${term}`)
        return res.status(200).json({ message:
            `User is no longer tracking ${subject} ${courseNum} in ${term}`})
    } catch (err) {
        console.log(err)
        return res.status(400).json({ error: 'Database error', err})
    }
});

module.exports = router