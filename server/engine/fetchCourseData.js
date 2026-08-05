require('dotenv').config({ path: `server/` + '/.env' });
const pool = require('../db')

async function fetchCourseData(courses) {

    const THRESHOLD_MINS = 15
    const updateCourse = []

    // get tc_ID from subject and courseNum
    const queryPrimses = courses.map(async (course) => {
        const res = await pool.query(
            'SELECT id FROM tracked_courses WHERE subject = $1 AND course_num = $2', [course.subject, course.courseNum]
        );
        return res.rows[0]
    });

    const results = await Promise.all(queryPrimses)

    return results

    /*
    const result = await pool.query(
        'SELECT DISTINCT section_id, tracked_courses_id FROM course_data'
    );

    const courseData = result.rows.map( row => {
        return {
            courseId: row.tracked_courses_id,
            seats: row.seats,
            waitlist: row.waitlist,
            checked: row.last_checked
        }
    });

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

    updateCourse.forEach((course) => {
        
    });

    */
}

module.exports = { fetchCourseData }