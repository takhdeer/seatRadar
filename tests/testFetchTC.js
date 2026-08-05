const { fetchTrackedCourses } = require('../server/engine/fetchTrackedCourses')

(async () => {
    console.log('------ Testing Fetching Tracked Courses -----')

    await fetchTrackedCourses()

    process.exit(0)
});
