require('dotenv').config({ path: `server/` + '/.env' });
const pool = require('../db')

async function getUserEmails(courseInfo) {
    const courseId = courseInfo.courseId
    let emails = []
    try {
        const res = await pool.query(
            'SELECT users.id as user_id, users.user_email, user_courses.notified FROM user_courses JOIN users ON user_courses.user_id = users.id WHERE user_courses.course_id = $1',
            [courseId]
        );

        console.log(`Found ${res.rows.length} users for course ${courseInfo.course}`);

        const result = res.rows.map(row => ({
            email: row.user_email,
            courseId: courseId,
            course: courseInfo.course,
            notified: row.notified
        }));
        emails.push(...result)
    } catch (err) {
        console.error('Error fetching user emails:', err);
        throw err;
    }
    return emails
}

module.exports ={ getUserEmails }

