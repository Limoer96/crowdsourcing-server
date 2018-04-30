// 仲裁模型

const mongoose = require('mongoose');

const arbitrationSchema = mongoose.Schema({
  date: Date,
  reason: { type: String, required: true },
  answer: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer'},
  status: { type: Number, enum: [0, 1] } // 0 代表仲裁 完成任务，1代表仲裁 未qw完成任务
});

const Arbitration = mongoose.model('Arbitration', arbitrationSchema);

module.exports = Arbitration;


