const { chromium, firefox, webkit } = require("playwright");
const browsers = { chromium, firefox, webkit };

async function cookieExtract(browserType) {

    const browser = await browsers[browserType].launch({ headless: false });

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


    console.log("browser closed");
    return cookies
}

cookieExtract('firefox');
