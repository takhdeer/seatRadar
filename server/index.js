const express = require('express');
require('dotenv').config();
const cors = require('cors');

const submitRoute = require('./routes/submit')
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
    res.send("Test sucessfull")
})

app.use('/api/submit',submitRoute);

app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`)
}); 