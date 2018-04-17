// 用户论坛的发帖记录

let mongoose = require('mongoose');

const DiscussSchema = mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: { type: String, required: true },
  desc: { type: String, required: true },
  date: { type: Date, default: Date.now() },
  comment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  status: { type: Number, enum: [0, 1, 2] }
});

const Discuss = mongoose.model('Discuss', DiscussSchema);

module.exports = Discuss;

/**
 * 用户发帖记录
 * 发帖用户
 * 发帖主题
 * 描述
 * 时间
 * 回复
 * 帖子状态 0 正常 1 不允许回复 2 已经删除
 */
