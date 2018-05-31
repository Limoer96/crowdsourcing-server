exports.handleServerError = function (res, msg) {
  const error = msg || 'Server Error';
  res.status(500).json({
    status: 2,
    error: error,
    data: ''
  })
}

exports.handleInvalidAuthError = function(res, msg) {
  const error = msg || '账户或密码不正确';
  res.status(400).json({
    data: '',
    error: error,
    status: 1
  })
}
