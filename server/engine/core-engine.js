const { fetchCourseData } = require('./fetchCourseData')
const { fetchTrackedCourses } = require('./fetchTrackedCourses')
const { getUserEmails } = require('./getUserEmails')
require('dotenv').config({ path: `server/` + '/.env' });


async function coreEngine() {
    const notifyCourses = []
    const trackedCourses = await fetchTrackedCourses()
    const courseData = await fetchCourseData(trackedCourses)
    for (let i = 0; i < courseData.length; i++) {
        if (courseData[i].seats > 0) {
            notifyCourses.push({
                seats: courseData[i].seats,
                course: courseData[i].course,
                courseId: courseData[i].courseId
            })
        }
        if (courseData[i].wiatlist > 0) {
            notifyCourses.push({
                wait: courseData[i].waitlist,
                course: courseData[i].course,
                courseId: courseData[i].courseId
            })
        }
    }
    if (notifyCourses.length === 0) {
        console.log('No notifications to send')
    }
    console.log(notifyCourses)

    let userEmails = []
    for (let i = 0; i < notifyCourses.length; i++) {
        const emails = await getUserEmails(notifyCourses[i])
        userEmails.push(...emails)
        console.log(userEmails)
        // sendEmail
        userEmails = []
    }
}

coreEngine()

module.exports = { coreEngine }