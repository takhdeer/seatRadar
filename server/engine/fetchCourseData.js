
require('dotenv').config({ path: `server/` + '/.env' });
const pool = require('../db')

async function fetchCourseData(courses) {

    const THRESHOLD_MINS = 15
    const updateCourse = []

    // get tc_ID from subject and courseNum
    const queryPromises = courses.map(async (course) => {
        const res = await pool.query(
            'SELECT id FROM tracked_courses WHERE subject = $1 AND course_num = $2', [course.subject, course.courseNum]
        );
        return res.rows[0]
    });

    const courseId = await Promise.all(queryPromises)

    console.log(courseId)


    const queryPromises2 = courseId.map(async (section, index) => {
        const result = await pool.query(
            'SELECT * FROM course_data WHERE tracked_courses_id = $1', [section.id]
        );

        const res = result.rows.map( row => {
            return {
                subject: courses[index].subject,
                courseNum: courses[index].courseNum,
                id: section.id,
                seats: row.seats,
                waitlist: row.waitlist,
                checked: row.last_checked
            }
        });
        return res
    });

    const courseData = await Promise.all(queryPromises2)
    console.log(courseData)

    courseData.forEach((section) => {
        if(section.id == null) {
            console.log('No course data Available')
            console.log('---- Fetching New Course Data ----')

            // fetch new Course data and add it to the database
        } 
    }) ;


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


}

module.exports = { fetchCourseData }