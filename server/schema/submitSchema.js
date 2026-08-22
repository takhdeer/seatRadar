const { z } = require('zod');

const courseSchema = z.object({
    subject: z.string().trim().min(1, 'Select a course'),
    courseNum: z.string().regex(/^\d{4}$/, 'Invalid Course Number'),
    term: z.string().trim().min(1, 'Select a term'),
}).strict();

module.exports = { courseSchema };