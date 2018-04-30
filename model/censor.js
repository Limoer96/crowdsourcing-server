// 创建一个管理员审查记录模型
const mongoose = require('mongoose');

const censorSchema = mongoose.Schema({
  date: Date,
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String, required: true }
})

const Censor = mongoose.model('Censor', censorSchema);

module.exports = Censor;

/**
 * date：审查发生的时间
 * task：与之相关的任务（如果有的话）涉及到任务被管理员关闭
 * reason：理由
 * user：与之相关的账户（后期涉及到用户封号这里才会用到）
 */