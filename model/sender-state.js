'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var senderStateSchema = new Schema({
  puid: {
    type: String,
    required: true
  },
  wechatRoom: String,
  state: String
});

module.exports = mongoose.model('senderState', senderStateSchema);
