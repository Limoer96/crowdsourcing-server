// 生成多位的任务id
const bcrypt = require('bcrypt');

exports.genTaskId = function genTaskId() {
  const timeStamp = Date.now();
  const tempId = 'task' + timeStamp + 'xxc';
  return bcrypt.hashSync(tempId, 10);
}
