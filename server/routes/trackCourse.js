const express = require('express')
const router = express.Router();
const pool = require('../db')

async function insertCourseData(courseData, subject, courseNum) {
    const result = await pool.query(
        'SELECT * FROM tracked_courses WHERE (subject, course_num) = ($1,$2)', [subject,courseNum]
    );
    const id = result.rows[0].id
    console.log(`Course ID: ${id}`)
    

    for (const section of courseData.sections) {
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
                    total_waitlist) 
                    VALUES ($1,$2,$3,$4,$5,$6,$7)`, 
                    [
                        id,
                        courseData.totalCount,
                        section.seatsAvailable,
                        section.waitAvailable,
                        sectionID,
                        section.total_seats,
                        section.total_waitlist
                    ]
            );
            console.log(`Course Saved in database`)

            await pool.query (
                `INSERT INTO professors (
                    course_id,
                    section_id,
                    prof)
                    VALUES ($1,$2,$3)`,
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
    }

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