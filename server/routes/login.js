const express = require('express')
const router = express.Router();
const { createClient } = require('@supabase/supabase-js')

const supabaseAnon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

router.post('/', async (req, res) => {
    console.log(req.body)
    const {email, password} = req.body

    if (!email || !password) {
        console.log('Missing Credentials')
        return res.status(400).json({message: 'Missing Credentails'})
    }

    try{
        const {data, error} = await supabaseAnon.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.log(error)
            return res.status(401).json({ message: 'Invalid Credentials'})
        }

        return res.status(200).json({
            message: 'Login Successful',
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            user_id: data.user.id
        });

    }catch(err) {
        console.log(err)
        res.status(500).json({error: 'Database error'})
    }
});

module.exports = router;