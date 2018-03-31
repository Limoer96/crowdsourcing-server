const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  host: 'smtp.163.com',
  port: 25,
  secure: false,
  auth: {
    user: 'mailerceshi@163.com',
    pass: 'motao123456'
  }
});

transporter.verify((err, succ) => {
  if(err) {
    console.log(err);
    console.log('连接邮件服务器错误')
  }else {
    console.log('连接邮件服务器成功');
  }
})

exports.sendVCMail = function sendVCMail(address, vcode) {
  const email = {
    from: '"H Fxxc 验证码" <mailerceshi@163.com>',
    to: address,
    suject: '验证码信息',
    text: `验证码：${vcode}，仅用于本次登录`
  }
  transporter.sendMail(email, (err, info) => {
    if(err) {
      console.log('无法发送邮件');
    }
    console.log(info);
  });
}

