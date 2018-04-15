var express = require('express');
let router = express.Router();
let uuidv4 = require('uuid/v4');
let fs = require("fs");
let handle = require("../util/handleResponseError");
let Answer = require('../model/answer');
let Task = require('../model/task');
let Record = require('../model/record');

const SU_ID = '5ad17820fcc7a4b2a8ae1d80';


router.post('/upload', (req, res, next) => {
  const u_id = req.decoded._id; //获取用户_id
  const { t_id, answer, images } = req.body.data;
  // 第一步，进行文件上传
  const paths = [];
  Answer.find({ author: u_id, task: t_id }, (err, rows) => {
    if(!err) {
      if(rows.length !== 0) {
        console.log(rows.length);
        res.json({ status: 8, error: '', data: '' });
      }else {
        try {
          for(let image of images) {
            let imageType = /^data:image\/(\w+);(\w+)/.exec(image.content);
            let fileName = uuidv4();
            let path = `public/upload/answerImage/${fileName}.${imageType[1]}`;
            paths.push(path);
            let base64 = image.content.replace(/^data:image\/\w+;base64,/, "");
            let imageBuffer = new Buffer(base64, 'base64');
            fs.writeFileSync(path, imageBuffer);
          }
            // 如果不存在错误
          new Answer({
            author: u_id,
            task: t_id,
            text: answer,
            img_src: paths
          }).save((err, result) => {
            if(!err) {
              Task.findByIdAndUpdate(t_id, { $push: { answers_: result._id } }, ((err1, res1) =>{
                if(!err) {
                  res.json({ status:0, data: '', error: '' })
                }
              }))
            }
          })
        } catch (error) {
          handle.handleServerError(res, '上传图片失败');
        }
      }
    }
  })
})
// 获取回答数据并返回
router.get('/info', (req, res, next) => {
  let _id = req.query.a_id;
  Answer.findById(_id).populate({
    path: 'author',
    select: 'user_id profile',
  })
  .populate({
    path: 'task',
    select: 'title time time_limit desc publish_info status'
  }).exec((err, result) => {
    if(err) {
      handle.handleServerError(res);
    }else {
      res.json({ status: 0, data: result, error: '' })
    }
  })
});

// 涉及到生成账单记录等并未开始实现

router.get('/confirm', (req, res, next) => {

  // 查看回答对应任务的状态，如果已经关闭的话，那么就不能在进行确认了，如果确认的话，就要生成账单信息，并且进行支付

  let _id = req.query.a_id;

  Answer.findById(_id)
    .populate('task')
    .exec((err, answer) => {
      if(answer.task.status === 2 || answer.status === 0) {
        // 任务被提前关闭/或者审核不过关被关闭
        res.json({ status: 6, error: '', data: '' })
      }else {
        // 创建订单支付并且修改回答的状态
        new Record({
          offset: answer.task.price * 0.7,
          count: 1,
          send: SU_ID,
          receive: answer.author,
          status: 0
        }).save((err, record) => {
          if(err) {
            handle.handleServerError(res);
          }else {
            answer.status = 0;
            answer.confirmTime =  Date.now();
            answer.save((err, result) => {
              if(err) {
                handle.handleServerError(res);
              }else {
                res.json({ status: 0, error: '', data: '' })
              }
            }); 
          }
        })
      }
    })
});

router.get('/reject', (req, res, next) => {
  let _id = req.query.a_id;
  Answer.findByIdAndUpdate(_id, { status: 2 }, (err, result) => {
    if(err) {
      handle.handleServerError(res);
    }else {
      res.json({ data: '', status: 0, error: '' })
    }
  })
})

module.exports = router;