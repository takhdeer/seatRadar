const { getUserEmails } = require('../server/engine/getUserEmails');

(async () =>{
    const courseId = '00887225-ba94-462a-a0f7-05a4804a77ec'

    const emails = await getUserEmails(courseId)
    console.log(emails)
})();