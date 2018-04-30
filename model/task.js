const mongoose = require('mongoose');
const Answer = require('./answer'); // 首先创建这个模型，不然无法populate
const User = require('./user');
const taskSchema = mongoose.Schema({
  t_id: { type: String, required: true },
  title: { type: String, required: true },
  desc: { type: String },
  time: { type: Date, default: Date.now()},
  types: [{ type: String }],
  limits: [{ type: String }],
  location: {
    lng: { type: Number },
    lat: { type: Number },
    address: { type: String },
    city: { type: String }
  },
  nums_need: { type: Number, min: 1 , default: 1},
  nums_confirm: { type: Number, min: 0, default: 0}, // 指的是已经接收任务的人数
  price: { type: Number, min: 0, default: 0 },
  time_limit: { type: Number, min: 1, default: 24 },
  status: { type: Number, enum: [0, 1, 2, 3],default: 0 }, // 正在进行 已结束 已经关闭 待发布
  publish_info: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  receive_users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  answers_: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  }],
  censor: { type: mongoose.Schema.Types.ObjectId, ref: 'Censor' }
})

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;

