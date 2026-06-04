const express = require('express');
const router = express.Router();
const pool = require('../db')


router.post('/', async (req, res) => {
    console.log(req.body)
    const { email, password} = req.body;

    if (!email || !password) {
        console.log('Missing Credentials')
        return res.status(400).json({error: "Missing Credentials"})
    }

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE user_email = $1', [email]
        )

        if (result.rows.length > 0) {
            console.log('user exists')
            return res.status(409).json({message: 'User exists'})
        }
        else{
            await pool.query(
                'INSERT INTO users (user_email, user_password) VALUES ($1,$2)', [email,password]
            )
            return res.status(201).json({message: "User created sucessfully!"})
        }

    }catch(err) {
        console.log(err)
        res.status(500).json({message: "Database error"})
    }
});

module.exports = router;