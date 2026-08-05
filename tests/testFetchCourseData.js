const { fetchTrackedCourses } = require('../server/engine/fetchTrackedCourses');
const {fetchCourseData } = require('../server/engine/fetchCourseData');

(async () => {
    console.log('----- Testing fetching course Id -----')

    console.log('----- Fetching Tracked Courses -----')
    const start = Date.now()
    const courses = await fetchTrackedCourses()

    console.log(courses)

    console.log('----- Fetching Course Data -----')
    const courseData = await fetchCourseData(courses)

    console.log(courseData)

    const elapsed = Date.now() - start

    console.log(`----- Time taken ${elapsed}ms -----`)

    process.exit(0)
})(); // invoke the IIFE