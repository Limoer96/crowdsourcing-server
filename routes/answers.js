var express = require('express');
let router = express.Router();
let uuidv4 = require('uuid/v4');
let fs = require("fs");
let handle = require("../util/handleResponseError");
let Answer = require('../model/answer');
let Task = require('../model/task');

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
    select: 'title time time_limit desc publish_info'
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
  let _id = req.query.a_id;
  Answer.findByIdAndUpdate(_id, { status: 0, confirmTime: Date.now() }, (err, result) => {
    if(err) {
      handle.handleServerError(res);
    }else {
      res.json({ status: 0, error: '', data: '' })
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