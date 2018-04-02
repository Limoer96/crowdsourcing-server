var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

const KEY = 'fafamnx!!2d**8z';
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


const allowCrossDomain = function(req, res, next) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.set('Access-Control-Allow-Headers', 'Content-Type, authorization');
  res.set('Access-Control-Allow-Credentials', 'true');
  next();
}

app.use(allowCrossDomain); // CORS

app.use((req, res, next) => {
  console.log('methods' ,req.method);
  if( req.method === 'OPTIONS' ) {
    console.log('option请求直接通过');
    next();
  }else {
    // 除去某些特定的API，其余的都做token的验证
    let { path } = req;
    if(path === '/api/users/auth' 
      || path === '/api/users/auth_vc' 
      || path === '/api/users/check_id_validation' 
      || path === '/api/users/regist'
      || path === '/api/users/send_reset_email'
      || path === '/api/users/reset_password'
    ) 
    {
      console.log('本次请求不需要验证权限');
      next();
    }else {
      const token = req.headers.authorization.split(' ')[1];
      req.token = token;
      jwt.verify(token, KEY, (err, decoded) => {
        if(err) {
          res.status(401).json({ status: 3, error: '用户认证失败', data: '' })
        }else {
          console.log('验证权限通过');
          req.decoded = decoded;
          next();
        }
      })
    }
  }
})

app.use('/', index);
app.use('/api/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
