const express = require('express');
// const { chromium, firefox, webkit } = require('playwright');
const router = express.Router();
const pool = require('../db')

// const browsers = { chromium, firefox, webkit }

/*
// Commented out to be used later
async function logIntoMRU(browserType) {
    const browser = await browsers[browserType].launch({ headless: false })

    //Creating context and page
    const context = await browser.newContext()
    const page = await context.newPage()
    
    await page.goto('https://ban9ssb-prod.mtroyal.ca/StudentRegistrationSsb/ssb/term/termSelection?mode=search')
    const title = await page.title()
    console.log(`On Page: ${title}`)

    await page.waitForLoadState('networkidle')

    const cookies = await context.cookies()
    console.log(cookies)

    // await browser.close()
    // console.log('browser closed')
}
*/

router.post('/', async (req, res) => {
    console.log(req.body)
    const { email, password} = req.body;

    if (!email || !password) {
        console.log('Missing Credentials')
        return res.status(400).json({error: "Missing Credentials"})
    }

    /*
    if (!(browserType in browsers)) {
        const error = 'Browser Not Supported'
        console.log(error)
        return res.status(403).json({error: "Unsupported Browser"})
    }
    */

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