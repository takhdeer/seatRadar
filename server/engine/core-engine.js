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
    // console.log(JSON.stringify(courseData, null, 2))

    for (let i = 0; i < courseData.length; i++) {
        if (courseData[i].seats > 0) {
            notifyCourses.push({
                seats: courseData[i].seats,
                course: courseData[i].course,
                courseId: courseData[i].courseId
            })
        }
        if (courseData[i].waitlist > 0) {
            notifyCourses.push({
                wait: courseData[i].waitlist,
                course: courseData[i].course,
                courseId: courseData[i].courseId
            })
        }
        if (courseData[i].seats === 0 && courseData[i].waitlist === 0){
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

    // group notifyCourses
    const grouped = new Map();

    notifyCourses.forEach(item => {
        if (!grouped.has(item.courseId)) {
            grouped.set(item.courseId, {
                courseId: item.courseId,
                course: item.course,
                seats: 0,
                waitlist: 0
            });
        }
        const entry = grouped.get(item.courseId);
        if (item.seats !== undefined) entry.seats += item.seats;
        if (item.wait !== undefined) entry.waitlist += item.wait;
    });

    const mapedCheckNotified = [...grouped.values()];
    console.log('------ Maped Check Notified ------')
    console.log(mapedCheckNotified)

    // group checkNotified

    const grouped2 = new Map();

    notifyCourses.forEach(item => {
        if (!grouped2.has(item.courseId)) {
            grouped2.set(item.courseId, {
                courseId: item.courseId,
                course: item.course,
                seats: 0,
                waitlist: 0
            });
        }
        const entry2 = grouped2.get(item.courseId);
        if (item.seats !== undefined) entry2.seats += item.seats;
        if (item.wait !== undefined) entry2.waitlist += item.wait;
    });

    const mapedNotifyCourses = [...grouped2.values()];
    console.log('------ Maped Notify Courses ------')
    console.log(mapedNotifyCourses)

    for (let i = 0; i < mapedNotifyCourses.length; i++) {
        const res = await getUserEmails(mapedNotifyCourses[i])
        const emails = res.filter(user => user.notified === false)
        console.log(emails)
        if (emails.length > 0) {
            const status = await setNotifiedFlag(emails, 1) // set notified = true
            console.log(status)
            // const {response} = await sendEmail(emails, mapedNotifyCourses[i])
        }
    }

    for (let i = 0; i < checkNotified.length; i++) {
        const users = await getUserEmails(checkNotified[i])
        // Filter users who have been notified and need to be reset
        const usersToReset = users.filter(user => user.notified === true)
        if (usersToReset.length > 0) {
            resetCourses.push(...usersToReset)
        }
    }
    if (resetCourses.length > 0) {
        const status = await setNotifiedFlag(resetCourses, 0) // set notified = false
        console.log(status)
    }

}

coreEngine()

module.exports = { coreEngine }