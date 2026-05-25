const express = require('express');
const { password } = require('pg/lib/defaults');
const { chromium, firefox, webkit } = require('playwright')
const router = express.Router();

const browsers = { chromium, firefox, webkit }

async function logIntoMRU(browserType, mruEmail, mruPassword) {
    const browser = await browsers[browserType].launch({ headless: false })
    const page = await browser.newPage()

    await page.goto('https://www.mymru.ca/',)
    const title = await page.title()
    console.log(`On Page: ${title}`)

    
    // Remove domain from email
    const username = mruEmail.split('@')[0]
    console.log(`${username}`)


    await page.fill('input[placeholder="User Name"]', username)
    await page.fill('input[placeholder="Password"]', mruPassword)
    await page.click('button:has-text("Sign In")')

    await page.waitForLoadState('networkidle')

    
    await browser.close()
    console.log('browser closed')
}

router.post('/', async (req, res) => {
    console.log(req.body)
    const { mruEmail, mruPassword, browserType} = req.body;

    if (!mruEmail || !mruPassword) {
        console.log('Missing MRU Credentials')
        return res.status(400).json({error: "Missing MRU Credentials"})
    }

    if (!(browserType in browsers)) {
        const error = 'Browser Not Supported'
        console.log(error)
        return res.status(403).json({error: "Unsupported Browser"})
    }

    await logIntoMRU(browserType, mruEmail, mruPassword)
    res.json({mruEmail, mruPassword, browserType})
});

module.exports = router;