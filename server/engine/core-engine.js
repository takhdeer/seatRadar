const { fetchCourseData } = require('./fetchCourseData')
const { fetchTrackedCourses } = require('./fetchTrackedCourses')
const { getUserEmails } = require('./getUserEmails')
const { sendEmail } = require('../utils/sendEmail')
const { setNotifiedFlag } = require('./setNotifiedFlag')
require('dotenv').config({ path: `server/` + '/.env' });


async function coreEngine() {
    const notifyCourses = []
    const checkNotified = []
    let userEmails = []
    let resetCourses = []

    const trackedCourses = await fetchTrackedCourses()
    const courseData = await fetchCourseData(trackedCourses)
    console.log(JSON.stringify(courseData, null, 2))
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
    }
    if (notifyCourses.length === 0) {
        console.log('No notifications to send')
    }
    console.log('------ Notify Courses ------')
    console.log(JSON.stringify(notifyCourses, null, 2))
    console.log('------ Check Notified ------')
    console.log(JSON.stringify(checkNotified, null, 2))

    /*
    for (let i = 0; i < notifyCourses.length; i++) {
        const res = await getUserEmails(notifyCourses[i])
        const emails = res.filter(user => user.notified === false) 
        console.log(emails)
        const status = await setNotifiedFlag(emails, 1) // set notified = true
        console.log(status)
        // const {response} = await sendEmail(userEmails, notifyCourses)
        userEmails = []
    }

    for (let i = 0; i < checkNotified.length; i++) {
        const courseInfo = await getUserEmails(checkNotified[i])
        if (courseInfo.notified === true) {
            const courseId = courseInfo.courseId
            resetCourses.push(...courseId)
        }
    }
    const status = await setNotifiedFlag(resetCourses, 0) // set notified = flase
    console.log(status)
    */
}

coreEngine()

module.exports = { coreEngine }