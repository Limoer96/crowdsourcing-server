const express = require('express');
const router  = express.Router();

const Task = require('../model/task');
const User = require('../model/user');
const Record = require('../model/record');
const handle = require('../util/handleResponseError');
const util  = require('../util/gen');

const SU_ID = '5ad17820fcc7a4b2a8ae1d80';

router.post('/addone', (req, res, next) => {
  const { title, desc, types, limits, location, nums_need, price, time_limit } = req.body;
  const _id = req.decoded._id; // 用户的_id

  User.findById(_id).exec((err, user) => {
    if(err) {
      handle.handleServerError(res);
    }else {
      let account = user.account;
      if(account < nums_need*price) {
        // 剩余任务点不足
        res.json({ data: '', error: '', status: 7 })
      }else {
        const task = new Task({
          t_id: util.genTaskId(),
          title: title,
          desc: desc,
          types: types,
          limits: limits,
          location: location,
          nums_need: nums_need,
          price: price,
          time_limit: time_limit,
          publish_info: _id,
          status: 3
        });
        task.save((err, result) => {
          if(err) {
            handle.handleServerError(res);
          }else {
            User.findByIdAndUpdate(_id, { $push: { tasks_publih: result._id }}, (err, obj) => {
              if(err) {
                handle.handleServerError(res);
              }else {
                res.json({ data: { _id: result._id}, error: '', status: 0 });
              }
            })
          }
        })
      }
    }
  })
})

// 通过_id来取得单条任务的详情信息

router.get('/gettaskinfo', (req, res, next) => {
  const _id = req.query.t_id;
  Task.findById(_id)
  .populate('answers_ publish_info receive_users')
  .exec((err, task) => {
    if(err) {
      console.log(err);
      handle.handleServerError(res);
    }else {
      res.json({ status: 0, error: '', data: task })
    }
  })
})

router.get('/close_one', (req, res, next) => {
  // 关闭一个任务，首先如果有人已经接受了任务，那么将支付任务点，否则的话创建订单，任务点返回用户账户(或者扣除后的账户);
  // 还得增加接收任务用户的账单记录。

  const _id = req.query.t_id;
  Task.findByIdAndUpdate(_id, { status: 2 })
  .populate('answers_ publish_info receive_users')
  .exec((err, task) => {
    if(err) {
      handle.handleServerError(res)
    }else {
      console.log('run 1');
      console.log('已经提交任务的人数', task.receive_users.length);
      if(task.receive_users.length > 0) {
        console.log("支付任务点给接收用户");
        for(let user of task.receive_users) {
          // 转账给接收任务的用户们
          new Record({
            offset: task.price * 0.7, // 平台盈利点暂定为0.3， 以后会根据更多条件来修改盈利点的 
            count: 1,
            send: SU_ID,
            receive: user._id,
            status: 0
          }).save((err2, record) => {
            if(err2) {
              handle.handleServerError(res);
            }else {
              console.log("支付成功，待更新用户数据");
              User.findByIdAndUpdate(user._id, { $push: { records: record._id}, $inc: { 'account': task.price } }, (err1, result) => {
                if(err1) {
                  handle.handleServerError(res);
                }
                console.log("更新用户数据成功1");
              })
            }
          })
        }
      }  
        // 返回给剩余的任务点(如果有剩余的话)
      console.log('判断是否有结余');
      if( task.nums_confirm < task.nums_need ) {
        console.log('有结余');
        new Record({
          offset: task.price,
          count: task.nums_need - task.nums_confirm,
          send: SU_ID,
          receive: task.publish_info._id,
          status: 0
        }).save((err3, record1) => {
          if(err3) {
            handle.handleServerError(res)
          }else {
            console.log("创建订单成功");
            // 更新用户
            User.findByIdAndUpdate(task.publish_info._id, { $push: { records: record1._id}, $inc: { 'account': task.price * (task.nums_need - task.nums_confirm) } }, (err4, result) => {
              if(err4) {
                handle.handleServerError(res);
              }else {
                console.log('更新用户数据成功2');
                res.json({ status: 0, error: '', data: task })
              }
            })
          }
        })
      }else {
        console.log('无结余');
        res.json({ status: 0, error: '', data: task });
      }
    }
  })
})

router.get('/reveive_task', (req, res, next) => {
  const _id = req.query.t_id; // 获得任务的id
  const u_id = req.decoded._id;
  // 更新两个部分 用户模型和采集id 任务模型的采集用户id
  // 1. 遍历用户已经采集的任务，如果已经采集就不再加入
  User.findById(u_id).select('tasks_receive').exec((err, obj) => {
    console.log(obj);
    if(obj.tasks_receive.indexOf(_id) > -1) {
      // 此时任务已经被加入
      res.json({ status: 5, data: '', error: '' })
    }else {
      User.findByIdAndUpdate(u_id, { $push: { tasks_receive: _id } }, (err, result) => {
        if(err) {
          handle.handleServerError(res);
        }else {
          Task.findByIdAndUpdate(_id, { $push: { receive_users: u_id }, $inc: { 'nums_confirm': 1 }}, (err, result) => {
            if(err) {
              handle.handleServerError(res);
            }else{
              res.json({ data: '', error: '', status: 0 })
            }
          })
        }
      })
    }
  })
})

// 在多条件查询之前先任务的状态


function updateTaskStatus() {
  Task.find({}, (err, tasks) => {
    tasks.forEach((task) => {
      if(new Date(task.time).getTime() + task.time_limit * 3600000 - Date.now() <= 0) {
        task.status = 1; // 表示结束
        task.save();
      }
    })
  })
}

// 多条件查询

router.post('/tasks_list_mult_conditions', (req, res, next) => {
  const { city, type, time_limit, nums_need, price } = req.body;

  updateTaskStatus(); // 更新一下状态
  
  let query = Task.find({ status: 0 });
  if(city !== '') {
    query = query.where('location.city').equals(city)
  }
  // 如果是全国的话， 跳过城市查询， 否则进行城市查询
  query.where('nums_need').lte(nums_need)
  .where('time_limit').lte(time_limit)
  .where('price').lte(price).populate('publish_info', '-password_hash')
  .exec((err, tasks) => {
    if(err) {
      handle.handleServerError(res)
    }else {
      // 再进行关于类型的筛选
      if(type !== '') {
        const tasksAfterFilter = [];
        tasks.forEach(task => {
          if(task.types.indexOf(type) !== -1) {
            tasksAfterFilter.push(task);
          }
        })
        res.json({ data: tasksAfterFilter, error: '', status: 0 })
      }else {
        res.json({ data: tasks, status: 0, error: '' })
      }
    }
  })
})




module.exports = router;