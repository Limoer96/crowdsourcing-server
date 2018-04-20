const mongoose = require('mongoose');
// const Discuss  = require('./discuss');

const commentSchema = mongoose.Schema({
  commenter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  comment:  { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  discuss: { type: mongoose.Schema.Types.ObjectId, ref: 'Discuss' },
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now() }
})

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;


/**
 * 评论内容
 * 评论时间
 * 评论人
 * 评论帖子
 * 暂时不涉及到针对评论的评论， 不支持点赞和点踩等
 */