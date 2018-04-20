// 用户论坛的发帖记录

let mongoose = require('mongoose');
const Comment = require('./comment');

const DiscussSchema = mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: { type: String, required: true }, // 主题，也就是title
  desc: { type: String }, // 描述，不是必须的
  desc_images: [{ type: String }], // 描述所使用的图片
  date: { type: Date, default: Date.now() }, // 发帖时间
  comment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }], // 评论
  status: { type: Number, enum: [0, 1, 2] } // 帖子处于的状态
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
