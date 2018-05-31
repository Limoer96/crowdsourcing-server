const express = require('express');
const jwt = require('jsonwebtoken');
const handle = require('../util/handleResponseError');
const router = express.Router();
const KEY = 'fafadgagsdf43241324645.';

const Task = require('../model/task');
const Discuss = require('../model/discuss');
const Record = require('../model/record');
const Comment = require('../model/comment');
const Censor = require('../model/censor');
const User = require('../model/user');
const Answer = require('../model/answer');
const Arbitration = require('../model/arbitration');

const OWNER_ID = '5ad17820fcc7a4b2a8ae1d80';

router.post('/auth', (req, res, next) => {
  const { name, password } = req.body.data;
  // 这里为了测试直接把admin写死
  if(name === 'admin' && password == '123456') {
    let token = jwt.sign({
      name: name
    }, KEY, {
      expiresIn: '1h'
    });
    res.json({ status: 0, error: '', data: { token: token, name: name } });
  }else {
    res.json({ status: 1, error: '用户验证失败', data: '' });
  }
})

router.get('/data', (req, res, next) => {
  let token = req.query.t;
  console.log('token', token);
  jwt.verify(token, KEY, (err, decoded) => {
    if(err) {
      res.json({ status: 6, error: '用户验证失败', data: '' })
    }else {
      // 查询各种数据并且返回总览 包括当前平台发布任务的数量，论坛发帖数量，平台收支等
      const taskPromise = Task.find({}).exec();
      const discussPromise = Discuss.find({}).count().exec();
      const recordPromise = Record.find({}).exec();
      const commentPromise = Comment.find({}).count().exec();
      Promise
        .all([taskPromise, discussPromise, recordPromise, commentPromise])
        .then(([tasks, discusses, records, comments]) => {
          // 统计task的数量
          let tasknums = [0, 0, 0, 0];
          for(let task of tasks) {
            tasknums[task.status] += 1;
          }
          let recordPriceNums = [0, 0, 0, 0, 0];
          for(let record of records) {
            recordPriceNums[record.type-1] += (record.offset * record.count);
          }
          res.json({ status: 0, error: '', data: {
            tasknums,
            recordPriceNums,
            discusses,
            comments
          } })         
        })
    }
  })
})


router.get('/tasks', (req, res, next) => {
  let token = req.query.t;
  jwt.verify(token, KEY, (err, decoded) => {
    if(err) {
      res.json({ status: 6, error: '用户验证失败', data: '' })
    }else {
      Task
        .find({ status: 0 })
        .populate('publish_info', '-password_hash')
        .exec((err, tasks) => {
          if(err) {
            handle.handleServerError(res);
          }else {
            // 取到随机不重复的10个任务
            if(tasks.length <= 10) {
              // 此时任务不多于十个，一次性发送。
              res.json({ status: 0, error: '', data: tasks })
            }else {
              let tempTasks = tasks.slice(); // 获取一份拷贝
              let result = [];
              for(let i = 0; i < 10; i++) {
                // 循环取, 为了防止取得同样的元素，取得一个元素就从数组中删除该元素。
                let randomIndex = Math.floor(Math.random()*tempTasks.length);
                result.push(tempTasks.splice(index, 1));
              }
              res.json({ status: 0, error: '', data: result })
            }
          }
        })
    }
  })
})


/**
 * 管理员关闭任务
 * 创建审查记录，更新任务状态，进行支付退款等
 */

router.post('/close_task', (req, res, next) => {
  let { token, reason, t_id, u_id, price, count } = req.body.data;
  jwt.verify(token, KEY, (err, decoded) => {
    if(err) {
      res.json({ status: 6, error: '用户验证失败', data: '' })
    }else {
      new Censor({ 
        task: t_id,
        reason: reason,
        date: Date.now()
      }).save((err, censor) => {
        if(err) {
          handle.handleServerError(res);
        }else {
          let taskPromise = Task.findByIdAndUpdate(t_id, { status: 1, censor: censor._id }).exec()
          let recordPromise = new Record({
            offset: price,
            count: count,
            send: OWNER_ID,
            receive: u_id,
            status: 0,
            date: Date.now(),
            ref: t_id,
            type: 3
          }).save()
          let userPromise = User.findByIdAndUpdate(u_id, { '$inc': { 'account': count*price } }).exec()
          Promise
            .all([taskPromise, recordPromise, userPromise])
            .then(([task, record, user]) => {
              res.json({ status: 0, error: '', data: '' })
            }).catch(err => {
              console.log(err);
              handle.handleServerError(res);
            })
        }
      })
    }
  })
})

router.get('/answers', (req, res, next) => {
  let token = req.query.t;
  jwt.verify(token, KEY, (err, decoded) => {
    if(err) {
      console.log(err);
      res.json({ status: 6 , error: '用户验证失败', data: '' })
    }else {
      // 取到所有被拒绝的answers
      Answer
        .find({ status: 2 })
        .populate('author', '-password_hash')
        .populate('task')
        .exec((err, answers) => {
          if(err) {
            handle.handleServerError(res);
          }else {
            res.json({ status: 0, error: '', data: answers })
          }
        })
    }
  })
})

// 拒绝， 也就是仲裁未完成任务
router.post('/arbitration_reject', (req, res, next) => {
  let { token, reason, price, t_id, u_id, a_id } = req.body.data;
  // 第一步，创建仲裁记录， 此时的记录status为1
  jwt.verify(token, KEY, (err, decoded) => {
    if(err) {
      res.json({ status: 6, error: '用户凭证失效', data: '' })
    }else {
      new Arbitration({
        date: Date.now(),
        reason: reason,
        answer: a_id,
        status: 1
      }).save((err, arbitration) => {
        if(err) {
          handle.handleServerError(res);
        }else {
          // 第二步，修改回答的状态，为回答添加仲裁记录
          Answer.findByIdAndUpdate(a_id, { status: 4, arbitration: arbitration._id }, (err, answer) => {
            // 创建订单记录，进行转账，由于认定未完成任务，任务点将会返还到发布者账户中
            new Record({
              offset: price * 0.8, // 20%手续费
              send: OWNER_ID,
              receive: u_id,
              count: 1,
              date: Date.now(),
              status: 0,
              type: 2,
              ref: t_id
            }).save((err, record) => {
              if(err) {
                handle.handleServerError(err);
              }else {
                // 更新用户账户
                User.findByIdAndUpdate(u_id, { '$inc': { 'account': price * 0.8 } }, (err, user) => {
                  if(err) {
                    handle.handleServerError(res);
                  }else {
                    // 此时处理完毕
                    res.json({ status: 0, error: '', data: '' })
                  }
                })
              }
            })
          })
        }
      })
    }
  })
})

// 仲裁成功
router.post('/arbitration_resolve', (req, res, next) => {
  let { token, reason, price, t_id, u_id, a_id } = req.body.data;
  // 第一步，创建仲裁记录， 此时的记录status为0
  jwt.verify(token, KEY, (err, decoded) => {
    if(err) {
      res.json({ status: 6, error: '用户凭证失效', data: '' })
    }else {
      new Arbitration({
        date: Date.now(),
        reason: reason,
        answer: a_id,
        status: 0
      }).save((err, arbitration) => {
        if(err) {
          handle.handleServerError(res);
        }else {
          // 第二步，修改回答的状态，为回答添加仲裁记录
          Answer.findByIdAndUpdate(a_id, { status: 4, arbitration: arbitration._id }, (err, answer) => {
            // 创建订单记录，进行转账，由于认定完成任务，任务点将会转入回答者账户中。
            new Record({
              offset: price * 0.7, // 正常交易，30%费率
              send: OWNER_ID,
              receive: u_id, // 此时为接收任务用户的_id
              count: 1,
              date: Date.now(),
              status: 0,
              type: 2,
              ref: t_id
            }).save((err, record) => {
              if(err) {
                handle.handleServerError(err);
              }else {
                // 更新用户账户
                User.findByIdAndUpdate(u_id, { '$inc': { 'account': price * 0.7 } }, (err, user) => {
                  if(err) {
                    handle.handleServerError(res);
                  }else {
                    // 此时处理完毕
                    res.json({ status: 0, error: '', data: '' })
                  }
                })
              }
            })
          })
        }
      })
    }
  })
})


module.exports = router;