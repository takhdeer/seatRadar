const express = require('express')
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
    console.log(req.body)
    const {email, password} = req.body

    if (!email || !password) {
        console.log('Missing Credentials')
        return res.status(400).json({message: 'Missing Credentails'})
    }

    try{
        const result = await pool.query(
            'SELECT * FROM users WHERE user_email = $1', [email]
        )

        if (result.rows.length > 0) {
            console.log('user exists')
            return res.status(200).json({message: 'User exists'})
        }
        else {
            console.log('user does not exist')
            return res.status(400).json({message: 'User does not exist'})
        }
    }catch(err) {
        console.log(err)
        res.status(500).json({error: 'Database error'})
    }
});

module.exports = router;