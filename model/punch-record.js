'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var punchRecordSchema = new Schema({
  name: {
        type: String,
        required: true
      },
  type: {
        type: String,
        required: true
      },
  message: String,
  attachment: String,
  createdAt: {
    type: Number,
    default: parseInt(new Date().getTime() / 1000)
  }
});

module.exports = mongoose.model('punchRecord', punchRecordSchema);
