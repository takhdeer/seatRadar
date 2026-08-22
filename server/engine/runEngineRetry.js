const { runCoreEngine } = require('./core-engine')

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * @param {number} maxAttempts - max number of times to attempt running the engine before giving up
 * @param {number} baseDelayMs - base delay (ms) used for exponential backoff between retries
 * @returns {Promise<string>} - resolves to the engine's success status, or 'Failed' if all attempts are exhausted
 */
async function runEngineRetry(MAX_ATTEMPTS, BASE_DELAY) {
    let attempt = 1
    while (attempt <= MAX_ATTEMPTS) {
        try {
            const status = await runCoreEngine()
            console.log(status)
            return status
        } catch (err) {
            if (attempt === MAX_ATTEMPTS) {
                console.log(err)
                return 'Failed'
            }
        }
        const delay = BASE_DELAY * 2**(attempt - 1) //exponential backoff
        await sleep(delay)        
        attempt += 1
    } 
}

module.exports = { runEngineRetry }
