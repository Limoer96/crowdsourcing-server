exports.handleServerError = function (res, msg) {
  const error = msg || 'Server Error';
  res.status(500).json({
    status: 2,
    error: error,
    data: ''
  })
}

exports.handleInvalidAuthError = function(res, msg) {
  const error = msg || 'Invalid User Input';
  res.status(400).json({
    data: '',
    error: error,
    status: 1
  })
}
