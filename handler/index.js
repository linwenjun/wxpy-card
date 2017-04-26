const async = require('async');

const SenderState = require('../model/sender-state');
const PunchRecord = require('../model/punch-record');

const isRecording = (stateReocrd)=> {
  return stateReocrd && stateReocrd.state === 'recording';
};

const fetchRecords = (cb)=> {
  let now = new Date();
  now.setHours(0);
  now.setMinutes(0);
  now.setSeconds(0);
  now.setMilliseconds(0);

  PunchRecord.find({
    createdAt: {$gt: now.getTime()}
  }, (err, docs)=> {
    docs = docs || [];

    let result = docs.map(item=> item.name).reduce((pre, cur)=> {
      if(pre.indexOf(cur) === -1) {
        pre.push(cur);
      }
      return pre;
    }, []);
    let nameList = result.join(',\n');
    cb(null, `
打卡情况
============
目前打卡人数:${result.length}
============
${nameList}
`.trim());
  });
};

const _handleChain = ({theState, records, msg}, cb)=> {

  async.series([(done)=> {
    // 无状态@机器人,但消息不以'打卡'结尾
    if(msg.is_at && /芝麻开门$/.test(msg.text)) {
      fetchRecords(done);
    } else {
      done(null, undefined)
    }
  }, (done)=> {
    // 无状态@机器人,消息以'打卡'结尾
    if(!isRecording(theState) && msg.is_at && /打卡$/.test(msg.text)) {

      SenderState.findOneAndUpdate(
          {puid: msg.member.puid},
          {state: 'recording'},
          {upsert: true, new: true},
          (err, doc)=> {
            info = `${msg.member.name},无图无真相,快发出你的打卡图片吧`;
            done(null, info);
          }
      );
    } else {
      done(null, undefined)
    }
  }, (done)=> {
    // 无状态@机器人,但消息不以'打卡'结尾
    if(!isRecording(theState) && msg.is_at && !/打卡$/.test(msg.text)) {
      done(null, `${msg.member.name},你怎么不按套路出牌,请@我并发送:打卡`)
    } else {
      done(null, undefined)
    }
  }, (done)=> {
    // 有状态,消息不是图片
    if(isRecording(theState) && msg.type !== 'picture') {

      SenderState.findOneAndUpdate(
          {puid: msg.member.puid},
          {state: undefined},
          {upsert: true, new: true},
          (err, doc)=> {
            info = `${msg.member.name},你这个人不讲究啊,说好的图片呢!重新@我吧`;
            done(null, info);
          }
      );
    } else {
      done(null, undefined)
    }
  }, (done)=> {
    // 记录状态,消息是图片
    if(isRecording(theState) && msg.type === 'picture') {

      SenderState.findOneAndUpdate(
          {puid: msg.member.puid},
          {state: undefined},
          {upsert: true, new: true},
          (err, doc)=> {
            PunchRecord.create({
              "puid": msg.member.puid,
              "name": msg.member.name,
              "attachment": msg.file
            }, ()=> {
              info = `${msg.member.name},你已经打卡成功了,你又向成功迈出了坚实的一步,恭喜!!`;
              done(null, info);
            });
          }
      );
    } else {
      done(null, undefined)
    }
  }], (err, results)=> {
    let result = results.find(item=> {
      return item
    });

    cb({
      type: result ? 'text' : 'none',
      info: result
    });
  });

  //
  // let result = {type: 'none'};
  //
  // if(!isRecording(theState) && msg.is_at) {
  //   let info = `${msg.member.name},你怎么不按套路出牌,请@我并发送:打卡`;
  //
  //   if(/打卡$/.test(msg.text)) {
  //     SenderState.findOneAndUpdate(
  //         {puid: msg.member.puid},
  //         {state: 'recording'},
  //         {upsert: true, new: true},
  //         (err)=> {
  //           console.log(err)
  //         }
  //     );
  //     info = `${msg.member.name},无图无真相,快发出你的打卡图片吧`;
  //   }
  //   result = {
  //     type: "text",
  //     info
  //   }
  // }
  //
  // cb(result);
};

const handle = (msg, cb)=> {
  //若无状态且at机器人,但发了其他话
  if(!msg.member || !msg.member.puid) {
    return cb({type: 'none'})
  }

  let puid = msg.member.puid;

  async.series({
    theState: (done)=> {
      SenderState.findOne({puid}, done)
    },
    records: (done)=> {
      PunchRecord.find({puid}, done)
    }
  }, (err, {theState, records})=> {
    _handleChain({theState, records, msg}, cb);
  });

};

module.exports = handle;