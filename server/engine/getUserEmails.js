require('dotenv').config({ path: `server/` + '/.env' });
const pool = require('../db')

async function getUserEmails(courseId) {
    try {
        const res = await pool.query(
            'SELECT users.id as user_id, users.user_email FROM user_courses JOIN users ON user_courses.user_id = users.id WHERE user_courses.course_id = $1',
            [courseId]
        );

        console.log(`Found ${res.rows.length} users for course ID ${courseId}`);

        const result = res.rows.map(row => (
            row.user_email
        ));
        console.log(result)
    } catch (err) {
        console.error('Error fetching user emails:', err);
        throw err;
    }
}

module.exports ={ getUserEmails }

