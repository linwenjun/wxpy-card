'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var punchRecordSchema = new Schema({
  puid: {
    type: String,
    required: true
  },
  name: String,
  attachment: String,
  createdAt: {
    type: Number,
    default: new Date().getTime()
  }
});

module.exports = mongoose.model('punchRecord', punchRecordSchema);
