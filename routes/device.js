
module.exports = function (app) {
  app.get('/devices/', function(req, res, next) {
    res.render('devices', { title: 'devices',prefix: ''});
  });
};

