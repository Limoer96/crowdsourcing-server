const mongoose = require('./db');

const taskSchema = mongoose.Schema({
  t_id: { type: String, required: true },
  title: { type: String, required: true },
  desc: { type: String },
  types: [{ type: String }],
  limits: [{ type: String }],
  location: {
    lng: { type: Number },
    lat: { type: Number },
    address: { type: String },
    city: { type: String }
  },
  nums_need: { type: Number, min: 1 , default: 1},
  nums_confirm: { type: Number, min: 0, default: 0},
  price: { type: Number, min: 0, default: 0 },
  time_limit: { type: Number, min: 1, default: 24 },
  status: { type: Number, enum: [0, 1, 2] },
  publish_info: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  receive_users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  answers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  }]
})

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;

