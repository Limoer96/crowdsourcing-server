const express = require('express');
const jwt = require('jsonwebtoken');
const handle = require('../util/handleResponseError');
const router = express.Router();
const KEY = 'fafadgagsdf43241324645.';

const Task = require('../model/task');
const Discuss = require('../model/discuss');
const Record = require('../model/record');

const OWNER_ID = '5ad17820fcc7a4b2a8ae1d80';

router.post('/auth', (req, res, next) => {
  const { name, password } = req.body.data;
  // 这里为了测试直接把admin写死
  if(name === 'admin' && password == '123456') {
    let token = jwt.sign({
      name: name
    }, KEY, {
      expiresIn: '1h'
    });
    res.json({ status: 0, error: '', data: { token: token, name: name } });
  }else {
    res.json({ status: 1, error: '用户验证失败', data: '' });
  }
})

router.get('/data', (req, res, next) => {
  let token = req.query.t;
  console.log('token', token);
  jwt.verify(token, KEY, (err, decoded) => {
    if(err) {
      res.json({ status: 6, error: '用户验证失败', data: '' })
    }else {
      // 查询各种数据并且返回总览 包括当前平台发布任务的数量，论坛发帖数量，平台收支等
      const taskPromise = Task.find({}).exec();
      const discussPromise = Discuss.find({}).count().exec();
      // const recordPromise = Record
      //   .find({'$where': 'this.send == "fafadgagsdf43241324645" || this.receive == "fafadgagsdf43241324645"'}).exec();
      const recordPromise = Record.find({}).exec();
      Promise
        .all([taskPromise, discussPromise, recordPromise])
        .then(([tasks, discusses, records]) => {
          // 统计task的数量
          let tasknums = [0, 0, 0, 0];
          for(let task of tasks) {
            tasknums[task.status] += 1;
          }
          let discussnums = discusses;
          let recordPriceNums = [0, 0, 0, 0, 0];
          for(let record of records) {
            console.log(record.type);
            recordPriceNums[record.type-1] += (record.offset * record.count);
          }
          console.log('task的数量', tasknums);
          console.log('discuss的数量', discussnums);
          console.log('price的', recordPriceNums); 
          res.json({ status: 0, error: '', data: '' })         
        })
    }
  })
})


module.exports = router;