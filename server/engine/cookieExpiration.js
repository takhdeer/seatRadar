const { cookieExtract } = require("../utils/cookieExtract");
require('dotenv').config({ path: `server/` + '/.env' });
const pool = require('../db')


const browserType = "firefox";
const subject = 'COMP'
const courseNum = '3612'
const termCode = '202604'

async function handleCookieExpiration() {
    // check if oldCookies are expired or not 
    const cookieData = await pool.query(
        'SELECT jsession, mru, updated_at FROM cookies WHERE id = 1'
    );


    const jsessionValue = cookieData.rows[0].jsession
    const mruValue = cookieData.rows[0].mru
    const oldSyncToken = cookieData.rows[0].sync_token
    const updatedAt = cookieData.rows[0].updated_at
    const oldCookies = [jsessionValue, mruValue]

    // finding time left on oldCookies
    const now = new Date();
    const diffMs = now - updatedAt;
    const diffMins = diffMs / 1000 / 60;

    const THRESHOLD_MINS = 10;
    
    console.log(`Cookies: JSESSION: ${jsessionValue}, MRU: ${mruValue}, SyncToken: ${oldSyncToken} Last Checked: ${updatedAt}`)

    const res = await fetch('http://localhost:3001/api/scrapper', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({subject, courseNum, termCode, oldCookies, oldSyncToken})
    });


    if (res.status === 404 || diffMins > THRESHOLD_MINS) { // works for no oldCookies in the req header
        
        console.log('----- Cookies Expired: Refreshing... ------')
        // returns: JSESSIONID first then MRUCookie
        const { cookies, syncToken } = await cookieExtract(browserType);

        await pool.query (
            `UPDATE oldCookies
             SET jsession = $1, mru = $2, sync_token = $3, updated_at = now()
             WHERE id = 1`, [cookies[0], cookies[1]], syncToken
        );
        console.log(`----- New oldCookies updated -----`)
        return { cookies, syncToken }
    }
    else {
        console.log(`------ Cookies are still valid ------`)
        return [jsessionValue, mruValue]
    }

}  

module.exports = { handleCookieExpiration }