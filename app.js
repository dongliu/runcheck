var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var config = require('./config/config.js');
var app = express();

//------------------ mongodb -------------------------
var mongoose = require('mongoose');
mongoose.connection.close();

require('./model/user.js');

var mongoOptions = {
  db: {
    native_parser: true
  },
  server: {
    poolSize: 5,
    socketOptions: {
      connectTimeoutMS: 30000,
      keepAlive: 1
    }
  }
};

var mongoURL = 'mongodb://' + (config.mongo.address || 'localhost') + ':' + (config.mongo.port || '27017') + '/' + (config.mongo.db || 'runcheck');

if (config.mongo.user && config.mongo.pass) {
  mongoOptions.user = config.mongo.user;
  mongoOptions.pass = config.mongo.pass;
}

if (config.mongo.auth) {
  mongoOptions.auth = config.mongo.auth;
}

mongoose.connect(mongoURL, mongoOptions);

mongoose.connection.on('connected', function () {
  console.log('Mongoose default connection opened.');
});

mongoose.connection.on('error', function (err) {
  console.log('Mongoose default connection error: ' + err);
});

mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection disconnected');
});
//----------------------------------------------------





//------------------ ad client -----------------------
var auth = require('./lib/auth');
var adClient = require('./lib/ldap-client').client;
adClient.on('connect', function () {
  console.log('ldap client connected');
});
adClient.on('timeout', function (message) {
  console.error(message);
});
adClient.on('error', function (error) {
  console.error(error);
});
//---------------------------------------------------




//---------------------- cookie and session -----------------------
var cookieParser = require('cookie-parser');
var session = require('express-session');
app.use(cookieParser());
app.use(session({
  secret: config.app.cookie_sec || 'runcheck_secret',
  cookie: {
    maxAge: config.app.cookie_life || 28800000
  },
  resave: true,
  saveUninitialized: true
}));
//-----------------------------------------------------------------




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(auth.proxied);
app.use(auth.sessionLocals);




//----------------------- router -----------------------
require('./routes/index')(app);
require('./routes/user')(app);
require('./routes/device')(app);
require('./routes/slot')(app);
require('./routes/slot-group')(app);
require('./routes/checklist')(app);
require('./routes/user')(app);
require('./routes/admin')(app);
//----------------------------------------------------

app.listen(3001, 'localhost');

module.exports = app;
