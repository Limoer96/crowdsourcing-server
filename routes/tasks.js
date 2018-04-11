const express = require('express');
const router  = express.Router();

const Task = require('../model/task');
const User = require('../model/user');
const handle = require('../util/handleResponseError');
const util  = require('../util/gen');

router.post('/addone', (req, res, next) => {
  const { title, desc, types, limits, location, nums_need, price, time_limit } = req.body;
  const _id = req.decoded._id; // 用户的_id
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
    publish_info: _id
  });
  task.save((err, result) => {
    if(err) {
      handle.handleServerError(res);
    }else {
      res.json({ data: { _id: result._id}, error: '', status: 0 })
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
  const _id = req.query.t_id;
  Task.findByIdAndUpdate(_id, { status: 2 })
  .populate('answers_ publish_info receive_users')
  .exec((err, task) => {
    if(err) {
      handle.handleServerError(res)
    }else {
      res.json({ status: 0, error: '', data: task })
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
          Task.findByIdAndUpdate(_id, { $push: { receive_users: u_id }}, (err, result) => {
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

// 多条件查询

router.post('/tasks_list_mult_conditions', (req, res, next) => {
  const { city, type, time_limit, nums_need, price } = req.body;
  
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
      console.log(err);
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