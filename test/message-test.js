const request = require('supertest');
const assert = require('assert');
const sinon = require('sinon');
const config = require('config');
const async = require('async');
const mongoose = require('mongoose');
const app = require('../app.js');
const SenderState = require('../model/sender-state');
const PunchRecord = require('../model/punch-record');
const __data_senderState = require('./fixture/sender-state.json');
const __data_punchRecord = require('./fixture/punch-record.json');


beforeEach((done)=> {
  async.waterfall([(cb)=> {
    SenderState.remove(cb);
  }, (data, cb)=> {
    SenderState.create(__data_senderState, cb)
  }, (data, cb)=> {
    PunchRecord.remove(cb);
  }, (data, cb)=> {
    PunchRecord.create(__data_punchRecord, cb)
  }], done)

});

describe('POST /message', ()=> {
  it('should respond json with type none', (done)=> {
    request(app)
        .post('/message')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, {
          type: 'none'
        }, done);
  });

  it('若不是群聊则忽略', (done)=> {
    request(app)
        .post('/message')
        .send({})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, {
          type: 'none'
        }, done);
  });

  it('若无状态且没有at机器人则忽略:群聊随便聊', (done)=> {
    request(app)
        .post('/message')
        .send({
          member: {
            puid: 1
          }
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, {
          type: 'none'
        }, done);
  });

  // 若无状态且at机器人,但发了其他话,
  // “**,你怎么不按套路出牌,你要 @我 打卡”
  it('若无状态且at机器人,但发了其他话', (done)=> {
    request(app)
        .post('/message')
        .send({
          member: {
            puid: 1,
            name: '大囧'
          },
          type: 'text',
          text: '问个问题',
          is_at: true
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, {
          type: 'text',
          info: '大囧,你怎么不按套路出牌,请@我并发送:打卡'
        }, done);
  });

  it('若状态无记录且at机器人,但发了其他话', (done)=> {
    request(app)
        .post('/message')
        .send({
          member: {
            puid: 99,
            name: '小囧'
          },
          type: 'text',
          text: '问个问题',
          is_at: true
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, {
          type: 'text',
          info: '小囧,你怎么不按套路出牌,请@我并发送:打卡'
        }, done);
  });

  //若无状态且at机器人,且以打卡结尾,状态切换回recording,回复“**，无图无真相,快发出你的照片吧”
  it('若无状态且at机器人,且以打卡结尾', (done)=> {

    const puid = 99;

    request(app)
        .post('/message')
        .set('Accept', 'application/json')
        .send({
          member: {
            puid,
            name: '小囧'
          },
          type: 'text',
          text: '@丢丢 我要打卡',
          is_at: true
        })
        .expect(200)
        .end((err, res)=> {
          assert.deepEqual(res.body, {
            type: 'text',
            info: '小囧,无图无真相,快发出你的打卡图片吧'
          });

          SenderState.findOne({puid}, (err, doc)=> {
            assert.equal(doc.state, 'recording');
            done();
          })
        });
  });

  // 若有状态且消息类型为其他,则打卡失败,状态切回无,"**,你这个人不讲究啊,说好的图片呢!重新@我吧"
  it('若有状态且消息类型为其他', (done)=> {

    const puid = 3;

    request(app)
        .post('/message')
        .set('Accept', 'application/json')
        .send({
          member: {
            puid,
            name: '小囧囧'
          },
          type: 'text',
          text: '我要打卡',
          is_at: true
        })
        .expect(200)
        .end((err, res)=> {
          assert.deepEqual(res.body, {
            type: 'text',
            info: '小囧囧,你这个人不讲究啊,说好的图片呢!重新@我吧'
          });

          SenderState.findOne({puid}, (err, doc)=> {
            assert.equal(doc.state, undefined);
            done();
          })
        });
  });

  it('若有状态且消息类型为图片', (done)=> {

    const puid = 3;

    request(app)
        .post('/message')
        .set('Accept', 'application/json')
        .send({
          member: {
            puid,
            name: '小囧囧'
          },
          type: 'picture',
          file: '001.jpg',
          is_at: true
        })
        .expect(200)
        .end((err, res)=> {
          assert.deepEqual(res.body, {
            type: 'text',
            info: '小囧囧,你已经打卡成功了,你又向成功迈出了坚实的一步,恭喜!!'
          });

          async.waterfall([(callback)=> {
            SenderState.findOne({puid}, (err, doc)=> {
              assert.equal(doc.state, undefined);
              callback(null, null)
            });
          }, (data, callback)=> {
            PunchRecord.find({puid}, (err, docs)=> {
              assert.equal(docs[docs.length-1].attachment, '001.jpg');
              callback(null, null);
            });
          }], done)

        });
  });


  it('获取打卡状态', (done)=> {
    sinon.stub(Date.prototype, "getTime")
        .returns(150);

    const puid = 3;

    request(app)
        .post('/message')
        .set('Accept', 'application/json')
        .send({
          member: {
            puid,
            name: '小囧囧'
          },
          type: 'text',
          text: '@丢丢 芝麻开门',
          is_at: true
        })
        .expect(200)
        .end((err, res)=> {
          assert.deepEqual(res.body, {
            type: 'text',
            info: `
打卡情况
============
目前打卡人数:2
============
小种,
小小种
`.trim()
          });
          done();
        });
  });
});