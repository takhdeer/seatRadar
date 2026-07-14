const express = require('express');
require('dotenv').config({ path: __dirname + '/.env' });

const cors = require('cors');

// Routes
const submitRoute = require('./routes/submit')
const signUpRoute = require('./routes/signup')
const logInRoute = require('./routes/login');
const cookieExtract = require('./utils/cookieExtract')
const scrapper = require('./utils/scrapper')
const tracker = require('./routes/trackCourse')
const storedData = require('./routes/getData')
const course = require('./routes/getCourse')
const prof = require('./routes/profs')

const app = express();
const port = 3001;

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
app.use('/api/profRatings', prof);

app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`)
}); 