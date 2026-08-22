const express = require('express');
require('dotenv').config({ path: __dirname + '/.env' });

const cors = require('cors');

// Routes
const submitRoute = require('./routes/submit')
const signUpRoute = require('./routes/signup')
const logInRoute = require('./routes/login');
const { router: cookieExtract } = require('./utils/cookieExtract')
const { router: scrapper } = require('./utils/scrapper')
const { router: tracker } = require('./routes/trackCourse')
const storedData = require('./routes/getData')
const course = require('./routes/getCourse')
const profRatings = require('./routes/getProfRating')
const profCourses = require('./routes/getProfCourses')
const userCourses = require('./routes/getUserCourses')
const storedSchedule = require('./routes/getSchedule')
const delCourse = require('./routes/delUserCourses')
const delSection = require('./routes/delSection')
const saveSection = require('./routes/saveSection')

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
    res.send("Test successfull")
})

app.use('/api/submit',submitRoute);
app.use('/api/usr-signup',signUpRoute);
app.use('/api/usr-login',logInRoute);
app.use('/api/cookies', cookieExtract);
app.use('/api/scrapper', scrapper); 
app.use('/api/track', tracker);
app.use('/api/getData', storedData);
app.use('/api/getCourse', course);
app.use('/api/getUserCourses', userCourses);
app.use('/api/getSchedule', storedSchedule)
app.use('/api/delCourse', delCourse)
app.use('/api/selectedSections', saveSection)
app.use('/api/delSections', delSection)
app.use('/api/profRatings', profRatings);
app.use('/api/profCourses', profCourses);

app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`)
}); 