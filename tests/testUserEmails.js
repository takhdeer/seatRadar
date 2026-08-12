const { getUserEmails } = require('../server/engine/getUserEmails');

(async () =>{
    const courseInfo = {
        courseId: '62fa7c14-4806-48f9-8ce5-02d4f941976a'
    }   
    const emails = await getUserEmails(courseInfo)
    console.log(emails)
})();