
const express = require('express');
const Comment = require('../model/comment');
const Discuss = require('../model/discuss');
const User = require('../model/user');
const handle = require('../util/handleResponseError');
const router = express.Router();

router.post('/upload', (req, res, next) => {
  let { d_id, u_id, c_id ,content } = req.body.data;
  let _id = req.decoded._id;
  let CommentModel;
  // 判断是否是针对评论下面评论的评论
  if(u_id && c_id) {
    CommentModel = new Comment({
      commenter: _id,
      content: content,
      comment: c_id,
      discuss: d_id,
      userRef: u_id,
      date: Date.now()
    });
  }else {
    // 此评论时是针对帖子的评论
    CommentModel = new Comment({
      commenter: _id,
      content: content,
      discuss: d_id,
      date: Date.now()
    });
  }
  CommentModel.save((err, comment) => {
    if(err) {
      console.log(err);
      handle.handleServerError(res);
    }else {
      Discuss.findByIdAndUpdate(d_id, { $push: { comment: comment._id } }, (err, discuss) => {
        if(err) {
          handle.handleServerError(res);
        }else {
          User.findByIdAndUpdate(_id, { $push: { comments: comment._id } }, (err, user) => {
            if(err) {
              handle.handleServerError(res);
            }else {
              res.json({status: 0, error: '', data: ''});
            }
          })
        }
      })
    }
  })
})

router.get('/list', (req, res, next) => {
  let d_id = req.query.d_id;
  Comment
    .find({ discuss: d_id })
    .populate('commenter', '-password_hash')
    .populate('userRef', '-password_hash')
    .exec((err, discusses) => {
      if(err) {
        handle.handleServerError(res);
      }else {
        res.json({ status: 0, error: '', data: discusses })
      }
    })
})



module.exports = router;