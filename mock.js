// mock数据
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/csapp');
  
mongoose.Promise = global.Promise;

const User = require('./model/user');
const Task = require('./model/task');
const Answer = require('./model/answer');
const util = require('./util/gen');

const taskId = util.genTaskId();

function addTask() {
  let task = new Task({
    t_id: taskId,
    title: '这个任务仅用于测试，写点什么吧',
    desc: '一条测试的任务, 写点对本应用的感受吧',
    types: ['远程任务', '建议获取'],
    limits: ['仅使用文本提交', '尽可能详细的描述', '不允许抄袭'],
    location: {
      lng: 36.6669400000,
      lat: 117.1401700000,
      address: '中国山东省济南市历城区舜华路1500号',
      city: '济南'
    },
    nums_need: 20,
    nums_confirm: 1,
    price: 1,
    time_limit: 36,
    status: 1,
    publish_info: '5ac6d5087e5fb263229dab3a',
    receive_users: ['5ac6d5087e5fb263229dab3a']
  });
  task.save((err, result) => {
    if(err) {
      console.log('插入任务失败');
    }else {
      console.log('插入任务成功');
    }
  })
}

function addRecord() {
  User.updateOne({ user_id: 'limoer' }, { $push: { tasks_publih: { t_id: taskId, status: 1 } } }, (err, result) => {
    if(err) {
      console.log('插入数据失败')
    }else {
      console.log("插入任务记录成功")
    }
  })
}

function addToUser() {
  User.findByIdAndUpdate('5ac6d5087e5fb263229dab3a', { $push: { tasks_publih: '5ac6d7d5da5d6e652a3890dd' } }, (err, user) => {
    if(err) {
      console.log("插入数据失败");
    }else {
      console.log("插入数据成功");
    }
  })
}

function getUserName() {
  Task.findById('5ac6d7d5da5d6e652a3890dd').populate('publish_info').exec((err, task) => {
    console.log('task user name:', task.publish_info.user_id);
  })
}

function addAnAnswer() {
  new Answer({
    author: '5ac6d5087e5fb263229dab3a',
    task: '5ac8612c0973a44856b9914a',
    text: '我觉得界面太丑啦！！！'
  }).save((err, res) => {
    if(err) {
      console.log(err)
    }else {
      console.log("插入回答成功");
    }
  })
}

function deleteRecord() {
  Task.findByIdAndUpdate('5ac8612c0973a44856b9914a', { $pull: {'receive_users': '5ac9ed08dd91eca1a95bcad0' } },
  (err, result) => {
    if(err) {
      console.log(err);
    }else {
      console.log("删除成功");
    }
  }  
)
}

// addTask();
// addToUser();
// getUserName();
// addAnAnswer();
deleteRecord();




