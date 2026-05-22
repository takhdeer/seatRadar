const express = require('express');
require('dotenv').config();
const cors = require('cors');

// Routes
const submitRoute = require('./routes/submit')
const mruCredRoute = require('./routes/mruCred')

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
    res.send("Test sucessfull")
})

app.use('/api/submit',submitRoute);
app.use('/api/mru-login',mruCredRoute);

app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`)
}); 