const express = require('express');
const uuidv4 = require('uuid/v4');
const fs = require('fs');

const Discuss = require('../model/discuss');
const handle = require('../util/handleResponseError');

const router = express.Router();


router.post('/upload', (req, res, next) => {
  const u_id = req.decoded._id; // 当前用户的_id
  const { subject, desc, images } = req.body.data;
  const paths = [];
  try {
    for(let image of images) {
      let imageType = /^data:image\/(\w+);(\w+)/.exec(image.content);
      let fileName = uuidv4();
      let path = `public/upload/discussImage/${fileName}.${imageType[1]}`;
      paths.push(path);
      let base64 = image.content.replace(/^data:image\/\w+;base64,/, "");
      let imageBuffer = new Buffer(base64, 'base64');
      fs.writeFileSync(path, imageBuffer);
    }
    new Discuss({
      author: u_id,
      subject: subject,
      desc: desc,
      desc_images: paths,
      date: Date.now(),
      status: 1
    }).save((err, discuss) => {
      if(err) {
        handle.handleServerError(res);
      }else {
        res.json({ data: '', status: 0, error: '' })
      }
    })
  } catch (error) {
    handle.handleServerError(res, '图片上传失败');
  }
})

router.get('/pagination', (req, res, next) => {
  const { page, page_size } = req.query;
  let skip = page_size * (page-1);
  Discuss
    .find({status: { '$in': [0, 1] }})
    .populate('author', '-password_hash')
    .exec((err, discusses) => {
      if(err) {
        handle.handleServerError(res);
      }else {
        let count = discusses.length;
        let list = discusses.slice(skip, skip+page_size);
        res.json({
          status: 0,
          error: '',
          data: {
            count,
            list
          }
        })
      }
    })
})

router.get('/info', (req, res, next) => {
  const _id = req.query.d_id;
  Discuss
    .findById(_id)
    .populate('author', '-password_hash')
    .populate('comment')
    .exec((err, discuss) => {
      if(err) {
        console.log(err);
        handle.handleServerError(res);
      }else {
        res.json({ status: 0, error: '', data: discuss })
      }
    })
})

module.exports = router;