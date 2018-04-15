const express = require('express');
const handle = require('../util/handleResponseError');
const Record = require('../model/record');
const Task = require('../model/task');
const User = require('../model/user');

const router = express.Router();
const SU_ID = '5ad17820fcc7a4b2a8ae1d80';

router.post('/pay', (req, res, next) => {
  const { count, offset, t_id } = req.body.data;
  const _id = req.decoded._id; // 这是用户的id
  // 进行用户扣费，创建交易记录，修改任务状态
  
  User.findById(_id, (err, user) => {
    if(err) {
      handle.handleServerError(res);
    }else {
      if(user.account < count*offset) {
        // 此时余额不足无法支付
        res.json({ status: 7, error: '', data: '' })
      }else {
        user.account = user.account - count*offset;
        user.save((err, user) => {
          if(err) {
            handle.handleServerError(res);
          }else {
            new Record({
              offset: offset,
              count: count,
              send: _id,
              receive: SU_ID,
              status: 0
            }).save((err, record) => {
              if(err) {
                handle.handleServerError(res)
              }else {
                // 更新任务状态，把订单添加到user的records字段下
              Task.findByIdAndUpdate(t_id, { status: 0 }).exec().then(() => {
                User.findByIdAndUpdate(_id, { $push: { records: record._id } }).exec().then(() => {
                  res.json({ data: '', status: 0, error: '' })
                })
              }).catch(() => {
                handle.handleServerError(res);
              })
              }
            })
          }
        })
      }
    }
  })
  
})



module.exports = router;
