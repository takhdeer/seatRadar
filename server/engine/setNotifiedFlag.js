require('dotenv').config({ path: `server/` + '/.env' });
const pool = require('../db');

/**
 * Checks if a slot has opened/closed and sets notified flag in database accordingly.
 * @param {Array} emails - Array of obj containing emails, courseId and course that must be notified.
 * @param {0/1} setFlag - Current seat count from the latest scrape.
 * @returns {Promise<void>}
 */
async function setNotifiedFlag(emails, setFlag) {
    if (setFlag === 1) {
        try {
            const queryPromises = emails.map(async (course) => {
                await pool.query(
                    'UPDATE user_courses SET notified = $1 WHERE course_id = $2', [true, course.courseId]
                );
                console.log(`Notified All users for ${course.course}`)
            })
            await Promise.all(queryPromises)
            return 'Notification set successful'
        } catch (err) {
            console.log(err)
            return 'Notification set unsucessful'
        }

    }
    if (setFlag === 0) {
        try {
            const queryPromises = emails.map(async (course) => {
                await pool.query(
                    'UPDATE user_courses SET notified = $1 WHERE course_id = $2', [false, course.courseId]
                );
                console.log(`Rest nofications for ${course.course}`)
            })
            await Promise.all(queryPromises)
            return `Notification reset successful`
        } catch (err) {
            console.log(err)
            return 'Notification reset unsucessful'
        }
    }
}

module.exports = { setNotifiedFlag }