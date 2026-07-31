const express = require('express');
const router = express.Router();

async function getCourseData(subject,courseNum,termCode,cookies) {
    const url = 
    `https://ban9ssb-prod.mtroyal.ca/StudentRegistrationSsb/ssb/searchResults/searchResults?txt_subject=${subject}&txt_keywordlike=${courseNum}&txt_term=${termCode}&startDatepicker=&endDatepicker=&pageOffset=0&pageMaxSize=10&sortColumn=subjectDescription&sortDirection=asc`

    console.log(`Fetching at url: ${url}`)

    const res = await fetch(url,{
        method: 'GET',
        headers: {
            'Cookie': `JSESSIONID=${cookies[0]}; MRUB9SSBPRODREGHA=${cookies[1]}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Referer': 'https://ban9ssb-prod.mtroyal.ca/StudentRegistrationSsb/ssb/classSearch/classSearch'
        },
    });

    const data = await res.json();
    return data
}

function parseJSON(courseData) {
    const parsedData = {
        totalCount: courseData.totalCount,
        sections: []
    };

    // for each shorthand instead of for loop
    // slice sets the domain for indexing
    courseData.data.slice(0, courseData.totalCount).forEach((section) => {
        parsedData.sections.push({
            sectionID: section.id,
            seatsAvailable: section.seatsAvailable,
            waitAvailable: section.waitAvailable,
            total_seats: section.maximumEnrollment,
            total_waitlist: section.waitCapacity,
            prof: section.faculty[0].displayName
        });

    });
    return parsedData
}

router.post('/', async (req, res) => {
    console.log(req.body)
    const { subject, courseNum, termCode, cookies} = req.body

    if (!subject || !courseNum || !termCode || !cookies) {
        return res.status(400).json({error: 'Missing Fields'})
    }

    const courseData = await getCourseData(subject,courseNum,termCode,cookies);
    const filteredData = parseJSON(courseData)
    res.json(filteredData)

});

module.exports = router;