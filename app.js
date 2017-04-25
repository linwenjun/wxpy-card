let express = require('express');
let bodyParser = require('body-parser');
let multer = require('multer');
let mongoose = require('mongoose');
let PunchRecord = require('./model/punch-record');

let app = express();

app.use(bodyParser.json());

function getCurrentTimeStamps() {
    let today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);

    return parseInt(today / 1000);
}

app.get('/punch-record', (req, res)=> {
    PunchRecord.find({
        createdAt: {$gt: getCurrentTimeStamps()}
    }, (err, doc)=> {
        let result = doc.reduce((pre, cur)=> {
            pre[cur.name] = pre[cur.name] || 0;
            pre[cur.name]++
            return pre;
        }, {});


        res.send({
            count: Object.keys(result).length,
            items: result
        });
    })
})

app.post('/punch-record', (req, res) => {

    PunchRecord.create(req.body, (err) => {
        if (err) {
            return res.send(err);
        }
        res.send(req.body);
    });
})

mongoose.connect("mongodb://mongo/wxrobot");

app.listen(3000, () => {
    console.log("Server started!")
})