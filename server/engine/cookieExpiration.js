const { cookieExtract } = require("../utils/cookieExtract");
require('dotenv').config({ path: `server/` + '/.env' });
const pool = require('../db')


const browserType = "firefox";
const subject = 'COMP'
const courseNum = '3612'
const termCode = '202604'

async function handleCookieExpiration() {
    // check if cookies are expired or not 
    const cookieData = await pool.query(
        'SELECT jsession, mru, updated_at FROM cookies WHERE id = 1'
    );


    const jsessionValue = cookieData.rows[0].jsession
    const mruValue = cookieData.rows[0].mru
    const updatedAt = cookieData.rows[0].updated_at
    const cookies = [jsessionValue, mruValue]

    // finding time left on cookies
    const now = new Date();
    const diffMs = now - updatedAt;
    const diffMins = diffMs / 1000 / 60;

    const THRESHOLD_MINS = 10;
    
    console.log(`Cookies: JSESSION: ${jsessionValue}, MRU: ${mruValue}, Last Checked: ${updatedAt}`)

    const res = await fetch('http://localhost:3001/api/scrapper', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({subject, courseNum, termCode, cookies})
    });


    if (res.status === 404 || diffMins > THRESHOLD_MINS) { // works for no cookies in the req header
        
        console.log('----- Cookies Expired: Refreshing... ------')
        // returns: JSESSIONID first then MRUCookie
        const newCookies = await cookieExtract(browserType);

        await pool.query (
            `UPDATE cookies
             SET jsession = $1, mru = $2, updated_at = now()
             WHERE id = 1`, [newCookies[0], newCookies[1]]
        );
        console.log(`----- New cookies updated -----`)
        return newCookies
    }
    else {
        console.log(`------ Cookies are still valid ------`)
        return [jsessionValue, mruValue]
    }

}  

module.exports = { handleCookieExpiration }