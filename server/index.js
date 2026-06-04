const express = require('express');
require('dotenv').config({ path: __dirname + '/.env' });

const cors = require('cors');

// Routes
const submitRoute = require('./routes/submit')
const signUpRoute = require('./routes/signup')
const logInRoute = require('./routes/login');
const cookieExtract = require('./utils/cookieExtract')

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

app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`)
}); 