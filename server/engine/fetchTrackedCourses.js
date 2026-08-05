require('dotenv').config({ path: `server/` + '/.env' });
const pool = require('../db')

async function fetchTrackedCourses() {
    const result = await pool.query(
        `SELECT DISTINCT subject, course_num FROM tracked_courses`
    );
    
    const courses = result.rows.map( row => {
        return {
            subject: row.subject,
            courseNum: row.course_num
        }
    });
    
    console.log(courses)
}

module.exports = fetchTrackedCourses