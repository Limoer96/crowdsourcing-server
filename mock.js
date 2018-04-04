// mock数据
const User = require('./model/user');
const Task = require('./model/task');
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
    publish_info: {
      user_id: 'limoer',
      time: Date.now()
    },
    receive_users: [
      {
        user_id: 'lindo',
        time_start: new Date(2018, 4, 2).getTime(),
        time_complete: new Date(2018, 4, 3).getTime(),
        confirmed: true,
        answer: {
          text: '可不可以配置多个主题啊！不喜欢绿色调为主的配色方案'
        }
      }
    ]
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

function run (){
  addTask();
  // addRecord();
}

run();


