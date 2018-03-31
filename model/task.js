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
  is_complete: { type: Boolean, default: false },
  publish_info: {
    user_id: { type: String, required: true },
    time: { type: Date, default: Date.now }
  },
  receive_users: [{
    user_id: { type: String },
    time_start: { type: Date, default: Date.now },
    time_complete: { type: Date },
    confirmed: { type: Boolean, default: false },
    answer: {
      text: { type: String },
      imgSrc: { type: String },
      videoSrc: { type: String }
    }
  }]
})

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;

