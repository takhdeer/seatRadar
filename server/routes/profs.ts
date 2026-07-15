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
    const { prof } = req.query
    const UNI = "Mount Royal University";

    if (!prof) {
        console.log('Missing Query Params')
        return res.status(404).json({ error: 'Missing Query Params'})
    }

    if (typeof prof !== 'string') {
        console.log('Prof name is not a string')
        return res.status(400).json({ error: 'Query Param prof not of type: string'})
    }

    const profRating = await findProfessor(UNI, prof);
    if (Object.keys(profRating).length === 0) {
        return res.status(404).json({ error: 'Professor not found' })
    }

    return res.status(201).json({ profRating })
});
 
module.exports = router