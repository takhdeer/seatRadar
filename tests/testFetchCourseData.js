const { fetchTrackedCourses } = require('../server/engine/fetchTrackedCourses');
const {fetchCourseData } = require('../server/engine/fetchCourseData');

(async () => {
    console.log('----- Testing fetching course Id -----')

    console.log('----- Fetching Tracked Courses -----')
    const start = Date.now()
    const courses = await fetchTrackedCourses()

    console.log(courses)

    console.log('----- Fetching Course Id -----')
    const courseId = await fetchCourseData(courses)

    console.log(courseId)

    const elapsed = Date.now() - start

    console.log(`----- Time taken ${elapsed}ms -----`)

    process.exit(0)
})(); // invoke the IIFE