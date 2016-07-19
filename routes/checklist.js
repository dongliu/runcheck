
module.exports = function (app) {
  app.get('/checklists/', function(req, res, next) {
    res.render('checklists', { title: 'checklists',prefix: ''});
  });
};

