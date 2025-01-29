const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors())
const port = process.env.PORT || 5000;

app.get('/', async (req, res) => {
    res.send('CUET Examflow Server running');
})

app.listen(port, () => {
    console.log('CUET Examflow running on port,', port);
})