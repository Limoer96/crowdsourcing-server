const mongoose = require('./db');

const AnswerSchema = mongoose.Schema({
  a_id: { type: String, required: true },
  date: { type: Date, default: Date.now },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task'},
  text: { type: String, required: true },
  img_src: { type: String },
  video_src: { type: String }
})

const Answer = mongoose.model('Answer', AnswerSchema);

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
 */
