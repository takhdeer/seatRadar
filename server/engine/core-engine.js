const { fetchCourseData } = require('./fetchCourseData')
const { fetchTrackedCourses } = require('./fetchTrackedCourses')
const { getUserEmails } = require('./getUserEmails')
const { sendEmail } = require('../utils/sendEmail')
const { setNotifiedFlag } = require('./setNotifiedFlag')
require('dotenv').config({ path: `server/` + '/.env' });


async function coreEngine() {
    const notifyCourses = []
    const checkNotified = []
    const userEmails = []
    const resetCourses = []

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
        else {
            checkNotified.push(courseData[i])
        }
        console.log(checkNotified)
    }
    if (notifyCourses.length === 0) {
        console.log('No notifications to send')
    }
    console.log(notifyCourses)

    for (let i = 0; i < notifyCourses.length; i++) {
        const emails = await getUserEmails(notifyCourses[i])
        userEmails.push(...emails)
        console.log(userEmails)
        // const {response} = await sendEmail(userEmails, notifyCourses)
        const status = setNotifiedFlag(notifyCourses, 1) // set notified = true
        console.log(status)
        userEmails = []
    }

    for (let i = 0; i < checkNotified.length; i++) {
        const courseInfo = await getUserEmails(checkNotified[i])
        if (courseInfo.notified === false) {
            const courseId = courseInfo.courseId
            resetCourses.push(...courseId)
        }
    }
    const status = setNotifiedFlag(resetCourses, 0) // set notified = flase
    console.log(status)
}

coreEngine()

module.exports = { coreEngine }