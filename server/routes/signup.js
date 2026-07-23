const express = require('express');
const router = express.Router();
const pool = require('../db')
const { createClient } = require('@supabase/supabase-js')

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);


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

        return res.status(201).json({ message: 'User created sucessfully'});

    }catch(err) {
        console.log(err.message)
        res.status(500).json({message: "Database error"})
    }
});

module.exports = router;