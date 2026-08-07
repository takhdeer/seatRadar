const express = require('express');
const router = express.Router();

async function getCourseData(subject,courseNum,termCode,cookies,syncToken) {
    const url = 
    `https://ban9ssb-prod.mtroyal.ca/StudentRegistrationSsb/ssb/searchResults/searchResults?txt_subject=${subject}&txt_keywordlike=${courseNum}&txt_term=${termCode}&startDatepicker=&endDatepicker=&pageOffset=0&pageMaxSize=10&sortColumn=subjectDescription&sortDirection=asc`

    // console.log(`Fetching at url: ${url}`)

    const res = await fetch(url,{
        method: 'GET',
        headers: {
            'Cookie': `JSESSIONID=${cookies[0]}; MRUB9SSBPRODREGHA=${cookies[1]}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Referer': 'https://ban9ssb-prod.mtroyal.ca/StudentRegistrationSsb/ssb/classSearch/classSearch',
            'X-Synchronizer-Token': syncToken
        },
    });

    // nodes fetch exposes raw headers via getSetCookie()
    const setCookieHeaders = res.headers.getSetCookie();

    const resMruCookie = setCookieHeaders.find(
        c => c.startsWith('MRUB9SSBPRODREGHA=')
    )
    ?.split(';')[0]
    ?.split('=')[1];

    console.log(`New MRU cookie`, resMruCookie)

    const courseData = await res.json();
    return { courseData, resMruCookie }
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
    // console.log(req.body)
    const { subject, courseNum, termCode, cookies, syncToken} = req.body

    if (!subject || !courseNum || !termCode || !cookies) {
        return res.status(400).json({error: 'Missing Fields'})
    }

    const { courseData } = await getCourseData(subject,courseNum,termCode,cookies,syncToken);

    if (courseData.totalCount == 0) {
        console.log('Course not found')
        return res.status(404).json({ error: 'Course not found' })
    }
    
    const filteredData = parseJSON(courseData)
    res.json(filteredData)

});

module.exports = { getCourseData, parseJSON, router };