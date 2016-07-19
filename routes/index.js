var authConfig = require('../config/config').auth;
var auth = require('../lib/auth');

module.exports = function (app) {
  app.get('/', function(req, res, next) {
    res.render('index', { title: 'runcheck',prefix: ''});
  });

  app.get('/login', auth.ensureAuthenticated, function (req, res) {
    if (req.session.userid) {
      return res.redirect(req.proxied ? auth.proxied_service : '/');
    }
    // something wrong
    res.send(400, 'please enable cookie in your browser');
  });

  app.get('/logout', function (req, res) {

  });

};

