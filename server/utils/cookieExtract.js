const express = require('express');
const router = express.Router();

const { chromium, firefox, webkit } = require("playwright");
const browsers = { chromium, firefox, webkit };

async function cookieExtract(browserType) {

    const browser = await browsers[browserType].launch({ headless: true });

    //Creating context and page
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(
      "https://ban9ssb-prod.mtroyal.ca/StudentRegistrationSsb/ssb/term/termSelection?mode=search"
    );

    const title = await page.title();
    console.log(`On Page: ${title}`);

    await page.waitForLoadState("networkidle");

    await page.click('.select2-choice')
    await page.click('text=Fall 2026')
    await page.click('text=continue')

    await page.waitForLoadState('networkidle');

    const allCookies = await context.cookies();
    const JSESSIONID = (allCookies.find(cookie => cookie.name === 'JSESSIONID')).value
    const MRUcookie = (allCookies.find(cookie => cookie.name === 'MRUB9SSBPRODREGHA')).value

    const cookies = [JSESSIONID, MRUcookie]
    console.log(cookies)

    await browser.close();
    console.log("browser closed");
    return cookies
}

router.post('/', async (req,res) => {
    console.log(req.body)
    const { browserType } = req.body

    if (!(browserType in browsers)) {
      const error = "Browser Not Supported";
      console.log(error);
      return res.status(403).json({ error: "Unsupported Browser" });
    }

    const cookies = await cookieExtract(browserType);
    res.json(cookies)
});

module.exports = { cookieExtract, router};
