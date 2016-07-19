
module.exports = function (app) {
  app.get('/slots/', function(req, res, next) {
    res.render('slots', { title: 'slots',prefix: ''});
  });
};

