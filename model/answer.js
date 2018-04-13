const mongoose = require('mongoose');
const User = require('./user');
const Task = require('./task');

const answerSchema = mongoose.Schema({
  date: { type: Date, default: Date.now },
  confirmTime: { type: Date },
  status: { type: Number, enum: [0,1,2,3,4], default: 1 }, // 3 4 分别表示仲裁成功和失败
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task'},
  text: { type: String, required: true },
  img_src: [ { type: String } ],
  video_src: { type: String }
});

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;


/**
 * 一个用于保存用户提交答案的集合
 * 回答的id
 * 回答的时间
 * 回答的人(作者)
 * 回答的问题
 * 文本内容： 必须
 * 图片内容： 可选
 * 视频内容： 可选
 * 回答状态： 0已经确认， 1待确认， 2已经拒绝
 */

