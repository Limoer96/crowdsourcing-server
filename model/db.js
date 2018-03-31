var mongoose =require('mongoose');
mongoose.connect('mongodb://localhost/csapp');
mongoose.Promise = global.Promise;

module.exports = mongoose;
