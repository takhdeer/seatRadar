const { getCourseData } = require('../utils/scrapper')
const { parseJSON } = require('../utils/scrapper')
const {handleCookieExpiration} = require('./CookieExpiration')
require('dotenv').config({ path: `server/` + '/.env' });
const pool = require('../db')

async function fetchCourseData(courses) {

    const THRESHOLD_MINS = 15
    const updateCourse = []

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
    console.log(courseData)

    for (let i = 0; i < courseData.length; i++) {
        if(courseData[i].data.length === 0) {
            console.log(`No course data Available for ${courseData[i].subject} ${courseData[i].courseNum}`)
            console.log('---- Fetching New Course Data ----')
            // getting cookies
            const cookies = await handleCookieExpiration()
            console.log(cookies)
            const newCourseData = await getCourseData(courseData[i].subject,courseData[i].courseNum,courseData[i].term,cookies)
            const filteredData = parseJSON(newCourseData);
            console.log(filteredData)
        } 
    }


    /*
    const now = new Date();

    courseData.forEach((section) => {
        const diff = (now - section.checked) / 1000 / 60
        if (diff > THRESHOLD_MINS) {
            updateCourse[section.courseId]
        }
        else {
            return diff
        }
    });

    */
}

module.exports = { fetchCourseData }