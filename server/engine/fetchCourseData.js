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

        const hasStoredData = oldCourseData[i].data.length > 0
        // Check if data exists before accessing it
        const shouldFetch = oldCourseData[i].data.length === 0 ||
                           (now - oldCourseData[i].data[0].last_checked) / 1000 / 60 > THRESHOLD_MINS ||
                           oldCourseData[i].data.length === 1;

        if(shouldFetch) {
            if (!hasStoredData) {
                console.log(`No course data Available for ${oldCourseData[i].subject} ${oldCourseData[i].courseNum}`)
            }
            else {
                console.log(`Refreshing ${oldCourseData[i].subject} ${oldCourseData[i].courseNum}: `)
            }

            const result = await resetBanner(cookies)
            console.log(`Reset status: ${result}`)
            // getting CourseData
            const courseData = await getCourseData(
                oldCourseData[i].subject,
                oldCourseData[i].courseNum,
                oldCourseData[i].term,
                cookies
            )

            // Validate courseData before parsing
            if (!courseData?.data) {
                console.error(`Failed to fetch valid course data for ${oldCourseData[i].subject} ${oldCourseData[i].courseNum}`);
                continue; // Skip to next course
            }

            const filteredData = parseJSON(courseData);
            const isReset = await resetBanner(cookies)

            if (!isReset) continue

            if (hasStoredData) {
                await pool.query(
                    'DELETE FROM course_data WHERE tracked_courses_id = $1',
                    [oldCourseData[i].id]
                );
            }
                const { id, err } = await insertCourseData(
                    filteredData,
                    oldCourseData[i].subject,
                    oldCourseData[i].courseNum
                )

                if (err){
                    console.log(err)
                }

                filteredData.sections.map(section => {
                    data.push({
                        course: `${oldCourseData[i].subject} ${oldCourseData[i].courseNum}`,
                        courseId: id,
                        seats: section.seatsAvailable,
                        waitlist: section.waitAvailable
                    })
                })

        }
        else {
            console.log('Course Data is up to date')
            
            oldCourseData[i].data.forEach(section => {
                data.push({
                    course: `${oldCourseData[i].subject} ${oldCourseData[i].courseNum}`,
                    courseId: section.tracked_courses_id,
                    seats: section.seats,
                    waitlist: section.waitlist
                })
            });
        }
    }
    
    return data
}

module.exports = { fetchCourseData }