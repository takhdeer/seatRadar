const express = require('express');
const router = express.Router();
const pool = require('../db')
const supabase = require('../utils/anonClient')

router.post('/', async (req, res) => {
    console.log(req.body)
    const { email, password, username} = req.body;

    if (!email || !password) {
        console.log('Missing Credentials')
        return res.status(400).json({error: "Missing Credentials"})
    }

    try {
         const {data, error} = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: process.env.FRONTEND_URL
            }
         });

         if (error) {
            if (error.status === 422 || error.code === 'weak_password') {
                console.log('Password is not secure')
                return res.status(500).json({ error: 'Password error', detail: error.message})
            }

            if (error.status === 400 || error.code === 'email_not_confirmed') {
                console.log('Email not confirmed')
                return res.status(400).json({ error: 'Email not confirmed'})
            }
            console.log(error);
            return res.status(500).json({ error: 'Auth error', detail: error.message})
        }

        if (data.user.identities.length === 0) {
            console.log('User exists');
            return res.status(409).json({ error: 'User Exists'})
        }

         const authUserID = data.user.id
         console.log(authUserID)

        await pool.query(
            'INSERT INTO users (id,user_email,user_password,username) VALUES ($1,$2,$3,$4)', [authUserID, email, password, username]
        );

        return res.status(201).json({
            message: 'Signup Successful'
        })

    }catch(err) {
        console.log(err.message)
        res.status(500).json({message: "Database error"})
    }
});

module.exports = router;