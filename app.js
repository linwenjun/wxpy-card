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
    // 若有状态且类型为图片,则打卡,状态切回无,"**,你已经打卡成功了,恭喜您,这是你连续第*天打卡了"
    // 若有状态且类型为其他,则打卡失败,状态切回无,"**,你这个人不讲究啊,说好的图片呢!重新@我吧"
    // 若无状态且at机器人,且以打卡结尾,状态切换回recording,回复“**，无图无真相,快发出你的照片吧”
    
    
    // 若当天已经打了2次卡,则“你已经打过卡了,不要再来烦我了”

});
//
// function getCurrentTimeStamps() {
//     let today = new Date();
//     today.setHours(0);
//     today.setMinutes(0);
//     today.setSeconds(0);
//     today.setMilliseconds(0);
//
//     return parseInt(today / 1000);
// }
//
// app.get('/punch-record', (req, res) => {
//     PunchRecord.find({
//         createdAt: { $gt: getCurrentTimeStamps() }
//     }, (err, doc) => {
//         let result = doc.reduce((pre, cur) => {
//             pre[cur.name] = pre[cur.name] || 0;
//             pre[cur.name]++
//             return pre;
//         }, {});
//
//
//         res.send({
//             count: Object.keys(result).length,
//             items: result
//         });
//     })
// });
//
// app.post('/punch-record', (req, res) => {
//
//     PunchRecord.create(req.body, (err) => {
//         if (err) {
//             return res.send(err);
//         }
//         res.send(req.body);
//     });
// });



app.listen(3000, () => {
    console.log("Server started!")
})

module.exports = app;