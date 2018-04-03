var express = require('express');
var router = express.Router();
const User = require('../model/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const KEY = 'fafamnx!!2d**8z';
const genCVs = require("../util/genVCs");
const mailer = require('../mailer');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


// 包含普通登录，邮箱免密登录
router.post('/auth', (req, res, next) => {
  const { user_id, password, email, vc }  = req.body;
  console.log(req.body);
  if(user_id && !email) {
    // 此时为普通用户登录
    User.find({ user_id: user_id }, (err, rows) => {
      if(err) {
        res.status(500).json({
          status: 2,
          error: 'Server Error',
          data: ''
        })
      }
      if(rows.length === 1) {
        const user = rows[0];
        const confirmed = user.confirmed;
        bcrypt.compare(password, user.password_hash, (err, result) => {
          if(result) {
            const token = jwt.sign({
              user_id: user_id
            }, KEY, {
              expiresIn: '1h'
            });
            res.json({ status: 0, error: '', data: { message: 'Success', token, confirmed, id: user._id } })
          }else {
            res.status(400).json({status: 1, error: 'INVALID USER INPUT', data: ''})
          }
        })
      }else {
        res.status(400).json({ status: 1, error: 'Invalid user input', data: '' })
      }
    });
  }else if(email && !user_id) {
    User.find({ email: email }, (err, rows) => {
      if(err) {
        res.status(500).json({
          status: 2,
          error: 'Server Error',
          data: ''
        })
      }
      if(rows.length === 1) {
        let user = rows[0];
        if(user.token === vc) {
          // 验证码输入正确
          res.json({ status: 10, error: '', data: { email: email } })
        }else {
          // 验证码输入错误
          res.status(400).json({ status: 1, error: '验证码输入错误', data:''})
        }
      }else {
        res.status(400).json({ status: 1, error: '邮箱或验证码错误', data: ''});
      }
      
    })
  }else {
    // 非法登录
    res.status(400).json({status: 1, error: '非法登录', data: ''})
  }
})

// 获取验证码，并发送至目标邮箱
router.post('/auth_vc', (req, res, next) => {
  const { email } = req.body; //
  User.find({ email: email }, (err, rows) => {
    console.log("run in");
    if(err) {
      console.log('err in');
      res.status(500).json({ status: 2, error: 'Server Error', data: '' })
    }
    if(rows.length === 0) {
      const vc = genCVs(6);
      let user = new User({
        user_id: email,
        password_hash: email,
        email: email,
        sex: 0,
        token: vc
      });
      user.save((err, result) => {
        if(err) {
          console.log('err', err);
          res.status(500).json({ status: 2, error: 'Server Error', data: ''})
        }else {
          mailer.sendVCMail(email, vc);
          res.json({status: 0, error: '', data: ''})
        }
      })
    }else {
      res.status(400).json({status: 1, error: '该邮件已被使用' ,data: ''})
    }
  }) 
})

router.post('/regist', (req, res, next) => {
  const { email, userId, password, sex, profile } = req.body;
  const hashed = bcrypt.hashSync(password, 10);
  User.findOneAndUpdate({ email: email }, { 
    user_id: userId, 
    password_hash: hashed, 
    sex: sex, 
    profile: profile,
    confirmed: true,
    token: ''
  }, 
    function(err, obj) {
      if(err) {
        res.status(500).json({ status: 2, error: 'Server Error', data: '' });
      }else{
        let token = jwt.sign({
          user_id: userId
        }, KEY, {
          expiresIn: '1h'
        });
        res.json({ status: 0, error: '', data: { token: token } })
      }
  })
})

router.post('/check_id_validation', (req, res, next) => {
  const { userId } = req.body;
  User.find({ user_id: userId }, (err, rows) => {
    if(err) {
      res.status(500).json({
        status: 2,
        data: '',
        error: 'Server Error'
      })
    }
    if(rows.length === 0) {
      res.json({ status: 0, data: '', error: '' })
    }else {
      res.json({ status: 1, data: '', error: '该用户名被占用' })
    }
  })
});


router.post('/send_reset_email', (req, res, next) => {
  console.log('run this router');
  const { email } = req.body;
  User.find({ email: email }, (err, rows) => {
    if(err) {
      res.status(500).json({ status:2, error: '服务器错误', data: ''})
    }
    if(rows.length === 0) {
      res.status(400).send({ status: 1, error: '不存在该用户', data: '' })
    }else {
      let user = rows[0];
      const token = jwt.sign({
        _id: user._id
      }, KEY, {
        expiresIn: 600
      })
      mailer.sendRestEmail(email, `http://localhost:8080/#/reset_password?t=${token}`);
      res.json({ status: 0, error: '', data: '' })
    }
  })
});


router.post('/reset_password', (req, res, next) => {
  const { token, password } = req.body;
  jwt.verify(token, KEY, function(err, decoded) {
    if(err) {
      res.status(401).json({ status: 1, error: '身份验证失败', data: ''})
    }else {
      let _id = decoded._id;
      bcrypt.hash(password, 10, function(err, hash) {
        User.update({ _id: _id }, { password_hash: hash }, (err, result) => {
          if(err){
            console.log(err);
            res.status(500).json({ status: 2, error: '服务器错误', data: '' })
          }else {
            res.json({ status: 0 ,error: '', data: '' })
          }
        })
      })
    }
  })
});

router.post('/user_info', (req, res, next) => {
  const { _id } = req.body;
  User.findById(_id, (err, user) => {
    if(err) {
      res.status(500).json({ status: 2, data: '', error: '服务器错误' })
    }else {
      const data = {
        userId: user.user_id,
        prifile: user.profile,
        sex: user.sex,
        taskComplete: user.tasks_publih.length,
        taskNow: 1,
        rate: 100,
        good_at: ['图像采集', '电脑技术', '远程任务'],
        taskPublish:  user.tasks_publih.length,
        taskReceive:  user.tasks_receive.length,
        discuss: 10,
        answers: 49
      }
      res.json({ status: 0, error: '', data: data })
    }
  })
})

module.exports = router;
