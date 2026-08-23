const express = require('express')
const router = express.Router();
const pool = require('../db')

async function insertCourseData(courseData, subject, courseNum, term) {
    const result = await pool.query(
        'SELECT * FROM tracked_courses WHERE (subject, course_num, term) = ($1,$2,$3)', [subject,courseNum, term]
    );
    const id = result.rows[0].id
    console.log(`Course ID: ${id}`)


    const queryPromise = courseData.sections.map(async (section) => {
        const sectionID = section.sectionID

        try {
            await pool.query (
                `INSERT INTO course_data (
                    tracked_courses_id,
                    total_count,
                    seats,
                    waitlist,
                    section_id,
                    total_seats,
                    total_waitlist,
                    days,
                    start_time,
                    end_time,
                    class_type)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                    ON CONFLICT (tracked_courses_id, section_id) 
                    DO UPDATE SET 
                        total_count = EXCLUDED.total_count,
                        seats = EXCLUDED.seats,
                        waitlist = EXCLUDED.waitlist,
                        total_seats = EXCLUDED.total_seats,
                        total_waitlist = EXCLUDED.total_waitlist,
                        days = EXCLUDED.days,
                        start_time = EXCLUDED.start_time,
                        end_time = EXCLUDED.end_time,
                        class_type = EXCLUDED.class_type,
                        last_checked = now()`,
                    [
                        id,
                        courseData.totalCount,
                        section.seatsAvailable,
                        section.waitAvailable,
                        sectionID,
                        section.total_seats,
                        section.total_waitlist,
                        section.days,
                        section.start,
                        section.end,
                        section.class_type
                    ]
            );
            console.log(`Course Saved in database`)

            await pool.query (
                `INSERT INTO professors (
                    course_id,
                    section_id,
                    prof)
                    VALUES ($1,$2,$3)
                    ON CONFLICT (course_id, section_id, prof) DO NOTHING`,
                    [
                        id,
                        sectionID,
                        section.prof
                    ]
            );
            console.log(`Prof saved in database`)

            return { id, err: null }
        }catch(err){
            return { id: null, err }
        }
    })

    const results = await Promise.all(queryPromise)

    // Check if any insertion failed
    const failedResult = results.find(r => r.err !== null)
    if (failedResult) {
        return { id: null, err: failedResult.err }
    }
    return { id, err: null }
}

router.post('/', async (req,res) => {
    console.log(req.body)
    const {courseData, subject, courseNum} = req.body

    if (!courseData || !subject || !courseNum) {
        return res.status(400).json({error: 'Missing Fields'})
    }

    const { err } = await insertCourseData(courseData, subject, courseNum)
    if (!err) {
        return res.status(201).json({ message: 'Course data saved successfully'})
    }
    else {
        console.log(err)
        return res.status(500).json({ error: 'Database error' })
    }
}); 

module.exports = {insertCourseData, router }