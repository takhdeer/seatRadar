const { getCourseData } = require('../utils/scrapper')
const { parseJSON } = require('../utils/scrapper')
const { handleCookieExpiration} = require('./CookieExpiration')
const { resetBanner } = require('../utils/resetBanner')
const { insertCourseData } = require('../routes/trackCourse')
require('dotenv').config({ path: `server/` + '/.env' });
const pool = require('../db')

async function fetchCourseData(courses) {

    const THRESHOLD_MINS = 15

    // get tc_ID from subject and courseNum
    const queryPromises = courses.map(async (course) => {
        const res = await pool.query(
            'SELECT id,term FROM tracked_courses WHERE subject = $1 AND course_num = $2', 
            [course.subject, course.courseNum]
        );
        return res.rows[0]
    });

    const courseInfo = await Promise.all(queryPromises)

    console.log(courseInfo)

    
    const queryPromises2 = courseInfo.map(async (section, index) => {
        const result = await pool.query(
            'SELECT * FROM course_data WHERE tracked_courses_id = $1', [section.id]
        );

        return {
            subject: courses[index].subject,
            courseNum: courses[index].courseNum,
            id: section.id,
            term: section.term,
            data: result.rows
        };
    });

    const oldCourseData = await Promise.all(queryPromises2)
    // console.log(JSON.stringify(oldCourseData, null, 2))

    // getting cookies
    const { cookies } = await handleCookieExpiration()
    console.log(cookies)

    
    const now = new Date();

    console.log('---- Fetching New Course Data ----')
    const data = []
    for (let i = 0; i < oldCourseData.length; i++) {
        const diffMs = now - oldCourseData[i].data[0].last_checked;
        const diffMins = diffMs / 1000 / 60;

        if(oldCourseData[i].data.length === 0 || diffMins > THRESHOLD_MINS) {
            if (oldCourseData[i].data.length === 0){
                console.log(`No course data Available for ${oldCourseData[i].subject} ${oldCourseData[i].courseNum}`)
            }
            else {
                console.log(`Refreshing ${oldCourseData[i].subject} ${oldCourseData[i].courseNum}: `)
            }

            // getting & inserting CourseData
            const courseData = await getCourseData(
                oldCourseData[i].subject,
                oldCourseData[i].courseNum,
                oldCourseData[i].term,
                cookies
            )
            const filteredData = parseJSON(courseData);
            console.log(filteredData)

            const isReset = await resetBanner(cookies)
            if (isReset === true) {
                await pool.query(
                    'DELETE FROM course_data WHERE tracked_courses_id = $1', 
                    [oldCourseData[i].data[0].tracked_courses_id]
                )
                const error = await insertCourseData(
                    filteredData,
                    oldCourseData[i].subject,
                    oldCourseData[i].courseNum
                )
                if (error){
                    console.log(error)
                }
                else {
                    const seats = filteredData.sections[0].seatsAvailable
                    const waitlist = filteredData.sections[0].waitlistAvailable
                    const subject = oldCourseData[i].subject
                    const courseNum = oldCourseData[i].courseNum
                    data.push({
                        course: `${subject} ${courseNum}`,
                        courseId: oldCourseData[i].data[0].tracked_courses_id,
                        seats: seats,
                        wiatlist: waitlist
                    })
                }
            }
            else {
                continue
            }
        }
        else {
            console.log('Course Data is up to date')
            data.push({
                course: `${oldCourseData[i].subject} ${oldCourseData[i].courseNum}`,
                courseId: oldCourseData[i].data[0].tracked_courses_id,
                seats: oldCourseData[i].data[0].seats,
                waitlist: oldCourseData[i].data[0].waitlist
            })
        }
    };
    return data
}

module.exports = { fetchCourseData }