const { fetchTrackedCourses } = require('../server/engine/fetchTrackedCourses');

(async () => {
    console.log('------ Testing Fetching Tracked Courses -----')

    const start = Date.now()

    const courses = await fetchTrackedCourses()
    console.log(courses)

    const elapsed = Date.now() - start

    console.log(`----- Times elapsed: ${elapsed}ms -----'`)

    process.exit(0)

})();
