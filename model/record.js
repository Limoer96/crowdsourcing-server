// 单条账户记录
const mongoose = require('mongoose');

const RecordSchema = mongoose.Schema({
  offset: { type: Number, required: true },
  send: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receive: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  count: { type: Number, required: true },
  date: { type: Date },
  status: { type: Number, enum: [0, 1, 2] },
  ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }  
  // 因为目前涉及到的订单都是与任务支付和退款有关，这里新增一个ref字段，表明产生交易的相关任务
});

const Record = mongoose.model('Record', RecordSchema);

module.exports = Record;

/**
 * 本次交易的金额 // 单个任务金额 例如 
 * 交易的(任务)数量
 * 交易双方
 * 交易时间
 * 交易状态 0 成功 1 失败 2 交易关闭
 * 
 */
