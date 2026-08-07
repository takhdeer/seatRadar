const { handleCookieExpiration } = require('../server/engine/cookieExpiration');

(async () => {
    console.log(`----- Testing cookieExpiration ------`)

    try {
        const start = Date.now()
        const cookie = await handleCookieExpiration()

        const elapsed = Date.now() - start
        console.log(`Result: ${cookie}`)
        console.log(`Time taken: ${elapsed}ms`)

        if (!cookie) {
            console.log(`No cookie returned`)
        }
        if (cookie) {
            console.log(`Cookie returned sucsessfuly `)
        }
    } catch (err) {
        console.log(`Error: ${err}`)
    }

    process.exit(0)
})();