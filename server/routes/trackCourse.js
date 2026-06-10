const express = require('express')
const router = express.Router();

async function dataloop(courseData) {
    // for each section in courseData
        // insert row into database
}

router.post('/', async (req,res) => {
    console.log(req)
    const {courseData} = req.body

});