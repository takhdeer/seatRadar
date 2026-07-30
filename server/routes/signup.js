const express = require('express');
const router = express.Router();
const pool = require('../db')
const supabaseAdmin = require('../utils/serviceRoleClient')
const supabase = require('../utils/anonClient')


router.post('/', async (req, res) => {
    console.log(req.body)
    const { email, password, username} = req.body;

    if (!email || !password) {
        console.log('Missing Credentials')
        return res.status(400).json({error: "Missing Credentials"})
    }

    try {
         const {data, error} = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
         });

         if (error) {
            if (error.status === 422 || error.code === 'email_exists') {
                console.log('user exists');
                return res.status(409).json({ message: 'User Exists'})
            }
            console.log(error);
            return res.status(500).json({ message: 'Auth error', detail: error.message})
         }

         const authUserID = data.user.id

        await pool.query(
            'INSERT INTO users (id,user_email,user_password,username) VALUES ($1,$2,$3,$4)', [authUserID, email, password, username]
        );

        const { data: signInData, error: signInError }  = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (signInError) {
            console.log(signInError)
            return res.status(500).json({ error: 'Sign in Database error' })
        }

        return res.status(201).json({
            message: 'Signup Successful',
            access_token: signInData.session.access_token,
            refresh_token: signInData.session.refresh_token,
            user_id: signInData.user.id
        })

    }catch(err) {
        console.log(err.message)
        res.status(500).json({message: "Database error"})
    }
});

module.exports = router;