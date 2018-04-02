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
  });
}

exports.sendRestEmail = function sendRestEmail(address, url) {
  const email = {
    from: '"H Fxxc 重置密码"<mailerceshi@163.com>',
    to: address,
    subject: '重置密码',
    html: `
      <p>H Fxxc 移动众包平台密码重置</p>

      <p><span>点击</span><a href="${url}">${url}</a><span>重置密码</span></p>
    `
  }
  transporter.sendMail(email, (err, info) => {
    if(err) {
      console.log('发送邮件失败');
    }
  })
}
