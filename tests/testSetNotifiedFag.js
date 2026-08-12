const { setNotifiedFlag } = require('../server/engine/setNotifiedFlag');

(async () =>{
    const notifyCourses = [
        {
          seats: 3,
          course: 'COMP 2659',
          courseId: '62fa7c14-4806-48f9-8ce5-02d4f941976a'
        },
        {
          seats: 8,
          course: 'MATH 1271',
          courseId: 'd659ae25-d38b-4c90-b406-15a1a89970d4'
        }
    ]
    const status = await setNotifiedFlag(notifyCourses, 1)
    console.log(status)
})();