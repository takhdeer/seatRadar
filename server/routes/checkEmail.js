const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
    const {email} = req.query

    if (!email) {
        console.log('Missing Credentials')
        return res.status(400).json({error: 'Email Missing'})
    }

    try {
        const result = await pool.query(
            'SELECT user_email FROM users WHERE user_email = $1', [email]
        );
        const userEmail = result.rows[0]
        if (userEmail!== undefined) {
            console.log(userEmail)
            return res.status(400).json({message: 'User Already Exists'})
        }
        return res.status(201).json({message: 'No Duplicate User Found'})
    } catch (err) {
        console.log(err)
        return res.status(500).json({message: 'Server Error'})
    }
});

module.exports = router