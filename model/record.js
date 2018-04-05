// 单条账户记录
const mongoose = require('./db');

const RecordSchema = mongoose.Schema({
  offset: { type: Number, required: true },
  send: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receive: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  status: { type: Number, enum: [0,1,2] }
});

const Record = mongoose.model('Record', RecordSchema);

module.exports = Record;

/**
 * 本次交易的金额
 * 交易双方
 * 交易时间
 * 交易状态 0 成功 1 失败 2 交易关闭
 * 
 */
