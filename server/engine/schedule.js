import cron from "node-cron";
const runEngineRetry = require('./runEngineRetry')

const MAX_ATTEMPTS = 3
const BASE_DELAY = 500
let isRunning = false

cron.schedule('* * * * *', async () => {
    if (isRunning) {
        console.log('----- Engine Running -----')
        return
    }
    
    isRunning = true

    try {
        await runEngineRetry(MAX_ATTEMPTS, BASE_DELAY)
    } catch (err) {
        console.log(err)
        throw new Error ('Scheduler Failure', err)
    }
    finally {
        isRunning = false
    }

})

console.log('Scheduler Started')