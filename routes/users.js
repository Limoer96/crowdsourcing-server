var express = require('express');
var router = express.Router();
const User = require('../model/user');
const Task = require('../model/task');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const KEY = 'fafamnx!!2d**8z';
const genCVs = require("../util/genVCs");
const mailer = require('../mailer');
const handle = require('../util/handleResponseError');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// 包含普通登录，邮箱免密登录
router.post('/auth', (req, res, next) => {
  const { user_id, password, email, vc }  = req.body;
  if(user_id && !email) {
    // 此时为普通用户登录
    User.find({ user_id: user_id }, (err, rows) => {
      if(err) {
        handle.handleServerError(res);
      }
      if(rows.length === 1) {
        const user = rows[0];
        const confirmed = user.confirmed;
        bcrypt.compare(password, user.password_hash, (err, result) => {
          if(result) {
            const token = jwt.sign({
              user_id: user_id,
              _id: user._id
            }, KEY, {
              expiresIn: '1h'
            });
            res.json({ status: 0, error: '', data: { message: 'Success', token, confirmed, id: user._id } })
          }else {
            handle.handleInvalidAuthError(res);
          }
        })
      }else {
        handle.handleInvalidAuthError(res);
      }
    });
  }else if(email && !user_id) {
    User.find({ email: email }, (err, rows) => {
      if(err) {
        handle.handleServerError(res);
      }
      if(rows.length === 1) {
        let user = rows[0];
        if(user.token === vc) {
          // 验证码输入正确
          res.json({ status: 10, error: '', data: { email: email } })
        }else {
          // 验证码输入错误
          handle.handleInvalidAuthError(res, '验证码输入错误');
        }
      }else {
        handle.handleInvalidAuthError(res, '邮箱或验证码输入错误');
      }
      
    })
  }else {
    // 非法登录
    handle.handleInvalidAuthError(res, '非法登录');
  }
})

// 获取验证码，并发送至目标邮箱
router.post('/auth_vc', (req, res, next) => {
  const { email } = req.body; //
  User.find({ email: email }, (err, rows) => {
    if(err) {
      handle.handleServerError(res);
    }
    if(rows.length === 0) {
      const vc = genCVs(6);
      // 初始化这个User
      let user = new User({
        user_id: email,
        password_hash: email,
        email: email,
        sex: 0,
        token: vc
      });
      user.save((err, result) => {
        if(err) {
          handle.handleServerError(res);
        }else {
          // 发送验证码到邮箱
          mailer.sendVCMail(email, vc);
          res.json({status: 0, error: '', data: ''})
        }
      })
    }else {
      handle.handleInvalidAuthError(res, '该邮箱已经被使用');
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
    function(err, user) {
      if(err) {
        handle.handleServerError(res);
      }else{
        // 颁发凭证，并设置一小时失效
        let token = jwt.sign({
          user_id: userId,
          _id: user._id
        }, KEY, {
          expiresIn: '1h'
        });
        res.json({ status: 0, error: '', data: { token: token, id: user._id} })
      }
  })
})

router.post('/check_id_validation', (req, res, next) => {
  const { userId } = req.body;
  User.find({ user_id: userId }, (err, rows) => {
    if(err) {
      handle.handleServerError(res);
    }
    if(rows.length === 0) {
      res.json({ status: 0, data: '', error: '' })
    }else {
      handle.handleInvalidAuthError(res, '该用户名已被占用');
    }
  })
});


router.post('/send_reset_email', (req, res, next) => {
  const { email } = req.body;
  User.find({ email: email }, (err, rows) => {
    if(err) {
      handle.handleServerError(res, '服务器错误');
    }
    if(rows.length === 0) {
      handle.handleInvalidAuthError(res, '不存在该用户');
    }else {
      let user = rows[0];
      // 颁发一个凭证，并且10分钟内有效
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
      handle.handleInvalidAuthError(res, '身份验证失败');
    }else {
      let _id = decoded._id;
      bcrypt.hash(password, 10, function(err, hash) {
        User.update({ _id: _id }, { password_hash: hash }, (err, result) => {
          if(err){
            handle.handleServerError(res);
          }else {
            res.json({ status: 0 ,error: '', data: '' })
          }
        })
      })
    }
  })
});

router.post('/user_info', (req, res, next) => {
  const _id  = req.body || '';
  User.findById(_id, (err, user) => {
    if(err) {
      handle.handleServerError(res);
    }else {
      // 这里的某些数据仅仅是模拟的
      const data = {
        _id: user._id,
        userId: user.user_id,
        prifile: user.profile,
        sex: user.sex,
        taskComplete: user.tasks_publih.length,
        taskNow: 1,
        rate: 100,
        good_at: ['图像采集', '电脑技术', '远程任务'],
        taskPublish:  user.tasks_publih.length,
        taskReceive:  user.tasks_receive.length,
        discuss: user.discusses.length,
        answers: user.comments.length
      }
      res.json({ status: 0, error: '', data: data })
    }
  })
})


router.get('/quick_login', (req, res, next) => {
  const user_id = req.decoded.user_id;
  const _id = req.decoded._id;
  // 重新颁发一个token，并且重置有效期
  const token = jwt.sign({
    user_id: user_id,
    _id: _id
  }, KEY, {
    expiresIn: '1h'
  })  
  res.json({ status: 0, error: '', data: { token: token } })
});

// 使用类似于表的外连接过后，该怎么操作呢！
router.get('/publish_tasks', (req, res, next) => {
  const { u, p } = req.query;
  const PAGE_SIZE = 8;
  let skip = PAGE_SIZE * (p - 1);

  User.find({ user_id: u }).populate('tasks_publih').exec().then((users) => {
    const user = users[0]; // 取得当前用户
    const count = user.tasks_publih.length;
    const currentList = user.tasks_publih.slice(skip, skip + 8);
    res.json({
      status: 0,
      error: '',
      data: {
        count: count,
        userId: u,
        lists: currentList
      }
    })
  }).catch(err => {
    handle.handleServerError(res, '发生了错误');
  }) 

});

router.get('/receive_tasks', (req, res, next) => {
  const _id = req.decoded._id;
  User
    .findById(_id)
    .populate('tasks_receive')
    .select('tasks_receive')
    .exec((err, user) => {
      if(err) {
        handle.handleServerError(res);
      }else {
        res.json({ data: user , error: '', status: 0});
      }
    })
})

module.exports = router;

