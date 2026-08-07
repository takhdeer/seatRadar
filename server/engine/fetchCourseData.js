const { getCourseData } = require('../utils/scrapper')
const { parseJSON } = require('../utils/scrapper')
const { handleCookieExpiration} = require('./CookieExpiration')
const { insertCourseData } = require('../routes/trackCourse')
require('dotenv').config({ path: `server/` + '/.env' });
const pool = require('../db')

async function fetchCourseData(courses) {

    const THRESHOLD_MINS = 15

    // get tc_ID from subject and courseNum
    const queryPromises = courses.map(async (course) => {
        const res = await pool.query(
            'SELECT id,term FROM tracked_courses WHERE subject = $1 AND course_num = $2', [course.subject, course.courseNum]
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

    const courseData = await Promise.all(queryPromises2)
    console.log(JSON.stringify(courseData, null, 2))

    const now = new Date();

    for (let i = 0; i < courseData.length; i++) {
        const diffMs = now - courseData[i].data[0].last_checked;
        const diffMins = diffMs / 1000 / 60;

        if(courseData[i].data.length === 0 || diffMins > THRESHOLD_MINS) {
            if (courseData[i].data.length === 0){
                console.log(`No course data Available for ${courseData[i].subject} ${courseData[i].courseNum}`)
            }
            else {
                console.log(`Refreshing ${courseData[i].subject} ${courseData[i].courseNum}: `)
            }

            console.log('---- Fetching New Course Data ----')

            // getting cookies
            const cookies = await handleCookieExpiration()
            console.log(cookies)

            // getting & inserting CourseData
            const newCourseData = await getCourseData(courseData[i].subject,courseData[i].courseNum,courseData[i].term,cookies)
            const filteredData = parseJSON(newCourseData);
            console.log(filteredData)

            await pool.query(
                'DELETE FROM course_data WHERE tracked_courses_id = $1', [courseData[i].data[0].id]
            )
            const error = await insertCourseData(filteredData, courseData[i].subject, courseData[i].courseNum)
            if (error){
                console.log(error)
            }
        }
        else {
            console.log('Course Data is up to date')
        }
    };

}

module.exports = { fetchCourseData }