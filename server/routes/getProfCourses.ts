import express, { Request, Response } from 'express';
import pool from '../db.js';
const router = express.Router();


router.get('/', async (req: Request, res: Response) => {
    const { courseID } = req.query

    if (!courseID || courseID.length === 0) {
        console.log('Course ID Invalid')
        return res.status(404).json({error: 'CourseID not found or Invalid'})
    }

    try{ 
        const result = await pool.query (
            `SELECT * FROM professors WHERE (course_id) = $1`, [courseID]
        );
        const profsArray: string[] = [];
        for(let i = 0; i < result.rows.length; i++) {
            profsArray.push(result.rows[i].prof);
        }
        console.log(profsArray)
        return res.status(201).json(profsArray)

    }catch (err) {
        console.log(err)
        return res.status(404).json({ error: 'Prof not found'})
    }

});

module.exports = router