require('dotenv').config({ path: `server/` + '/.env' });
const pool = require('../db')

async function getUserEmails(courseInfo) {
    courseId = courseInfo.courseId
    let emails = []
    try {
        const res = await pool.query(
            'SELECT users.id as user_id, users.user_email FROM user_courses JOIN users ON user_courses.user_id = users.id WHERE user_courses.course_id = $1',
            [courseId]
        );

        console.log(`Found ${res.rows.length} users for course ${courseInfo.course}`);

        const result = res.rows.map(row => (
            row.user_email
        ));
        emails.push(...result)
    } catch (err) {
        console.error('Error fetching user emails:', err);
        throw err;
    }
    return emails
}

module.exports ={ getUserEmails }

