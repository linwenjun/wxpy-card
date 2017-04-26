const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const PunchRecord = require('./model/punch-record');
const config = require('config');
const handler = require('./handler');

const app = express();

app.use(bodyParser.json());

mongoose.connect(config.get('mongodb-url'));

app.post('/message', (req, res) => {
    
    handler(req.body, (data)=> {
        res.send(data)
    });
});

app.listen(3000, () => {
    console.log("Server started!")
});

module.exports = app;