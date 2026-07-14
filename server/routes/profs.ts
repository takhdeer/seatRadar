import express, { Request, Response } from 'express';
import { RateMyProfessor } from 'rate-my-professor-api-ts';
const router = express.Router();

async function findProfessor(schoolName: string, professorName: string) {
    const rmp_instance = new RateMyProfessor(schoolName, professorName);
    const info = await rmp_instance.get_professor_info();
    console.log(info);
    return info;
}

router.get('/', async (req: Request, res: Response) => {
    const {subject, courseNum, prof} = req.query
    const UNI = "Mount Royal University";

    if (!subject || !courseNum || !prof) {
        console.log('Missing Query Params')
        return res.status(404).json({ error: 'Missing Query Params'})
    }

    if (typeof prof !== 'string') {
        console.log('Prof name is not a string')
        return res.status(400).json({ error: 'Query Param prof not of type: string'})
    }

    const profRating = findProfessor(UNI, prof);
    return res.status(201), profRating
});

module.exports = router