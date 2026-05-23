const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    console.log(req.body)
    const { mruEmail, mruPassword } = req.body;

    if (!mruEmail || !mruPassword) {
        return res.status(400).json({error: "Missing MRU Credentials"})
    }

    res.json({mruEmail, mruPassword})
    // pass to playwright 
});

module.exports = router;