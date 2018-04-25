const express = require('express');
const User = require('../model/user');
const Record = require('../model/record');
const handle = require('../util/handleResponseError');

const router = express.Router();

/**
 * 获得当前用户账户金额
 */

router.get('/get_account', (req, res, next) => {
  let _id = req.decoded._id; // 获取用户_id
  User.findById(_id).select('account').exec((err, user) => {
    if(err) {
      handle.handleServerError(res);
    }else {
      res.json({ data: user, status: 0, error: '' })
    }
  })
})

router.post('/recharge', (req, res, next) => {
  let _id = req.decoded._id;
  let { count } = req.body.data;
  /**
   * 充值步骤：
   * 1. 创建并保存订单信息
   * 2. 修改用户账户金额和更新用户交易记录
   */
  new Record({
    offset: count,
    receive: _id,
    count: 1,
    date: Date.now(),
    status: 0,
    text: '账户充值',
    type: 4
  }).save((err, record) => {
    if(err) {
      handle.handleServerError(res);
    }else {
      User.findByIdAndUpdate(_id, { '$inc': { 'account': count }, '$push': { 'records': record._id } }, (err, user) => {
        if(err) {
          handle.handleServerError(res);
        }else {
          res.json({ statu: 0, error: '', data: '' })
        }
      })
    }
  })
})

router.post('/cash', (req, res, next) => {
  let _id = req.decoded._id;
  let { count, card, name } = req.body.data;
  /**
   * 提现步骤
   * 1. 创建订单信息
   * 2. 修改用户账户金额，并且保存交易记录
   */
  new Record({
    offset: count,
    send: _id,
    count: 1,
    date: Date.now(),
    status: 0,
    type: 5,
    text: `提现到${card}, 持卡人姓名：${name}。`
  }).save((err, record) => {
    if(err) {
      handle.handleServerError(res);
    }else {
      User.findByIdAndUpdate(_id, { '$inc': { 'account': -count }, '$push': { 'records': record._id }}, (err, user) => {
        if(err) {
          handle.handleServerError(res);
        }else {
          res.json({ status: 0, error: '', data: '' })
        }
      })
    }
  })
})

router.get('/account_detail', (req, res, next) => {
  let _id = req.decoded._id;
  Record
    .find({ '$where': function(_id) {
      for(let record in this) {
        if(record.send == _id || record.receive == _id) {
          return true;
        }else {
          return false;
        }
      }
    }})
    .sort({ date: -1 })
    .exec((err, records) => {
      if(err) {
        console.log(err);
        handle.handleServerError(res);
      }else {
        res.json({ status: 0, error: '', data: records })
      }
    })
})

module.exports = router;