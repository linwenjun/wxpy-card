const async = require('async');

const SenderState = require('../model/sender-state');
const PunchRecord = require('../model/punch-record');

const isRecording = (stateReocrd)=> {
  return stateReocrd && stateReocrd.state === 'recording';
};

const _handleChain = ({theState, records, msg}, cb)=> {

  async.series([(cb)=> {
    if(!isRecording(theState) && msg.is_at) {
      
    }
  }], (results)=> {

  });


  let result = {type: 'none'};

  if(!isRecording(theState) && msg.is_at) {
    let info = `${msg.member.name},你怎么不按套路出牌,请@我并发送:打卡`;

    if(/打卡$/.test(msg.text)) {
      SenderState.findOneAndUpdate(
          {puid: msg.member.puid},
          {state: 'recording'},
          {upsert: true, new: true},
          (err)=> {
            console.log(err)
          }
      );
      info = `${msg.member.name},无图无真相,快发出你的打卡图片吧`;
    }
    result = {
      type: "text",
      info
    }
  }

  cb(result);
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