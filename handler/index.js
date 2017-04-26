const async = require('async');

const SenderState = require('../model/sender-state');
const PunchRecord = require('../model/punch-record');

const isRecording = (stateReocrd)=> {
  return stateReocrd && stateReocrd.state === 'recording';
};

const _handleChain = ({theState, records, msg}, cb)=> {

  async.series([(done)=> {
    // 无状态@机器人,但消息不以'打卡'结尾
    if(!isRecording(theState) && msg.is_at && !/打卡$/.test(msg.text)) {
      done(null, `${msg.member.name},你怎么不按套路出牌,请@我并发送:打卡`)
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
    // 无状态@机器人,消息以'打卡'结尾
    if(isRecording(theState) && msg.type === 'text') {

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