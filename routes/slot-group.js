
module.exports = function (app) {
  app.get('/slot-groups/', function(req, res, next) {
    res.render('slot-groups', { title: 'slot-groups',prefix: ''});
  });
};
