var mongoose =require('mongoose');

function connect() {
  mongoose.connect('mongodb://localhost/csapp');
  mongoose.Promise = global.Promise;
}

module.exports = connect;
