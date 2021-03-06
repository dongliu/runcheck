/************
 * run the following script to start a mongo instance on port 27018 at /tmp/db
 * mongod --port 27018 --dbpath /tmp/db
 ***********/

require('should');
var debug = require('debug')('runcheck:test');
var mongoose = require('mongoose');
mongoose.connection.close();
var util = require('util');

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

var mongoURL = 'mongodb://localhost:27018/runcheck_test';


var userSchema = require('../models/user').userSchema;
var History = require('../models/history').History;
var plugin = require('../models/history').addHistory;
userSchema.plugin(plugin, {
  fieldsToWatch: ['name', 'email', 'roles.admin', 'roles.leader']
});
debug('the test user schema is: ' + util.inspect(userSchema, false, null));
var UserTest = mongoose.model('UserTest', userSchema);


describe('model/history', function () {
  this.timeout(15 * 1000);
  before(function (done) {
    mongoose.connect(mongoURL, mongoOptions, function (err) {
      if (err) {
        return done(err);
      }
      debug('conn ready:  ' + mongoose.connection.readyState);
      UserTest.remove({}, function (userErr) {
        if (userErr) {
          return done(userErr);
        }
        done();
      })
    });
  });

  after(function (done) {
    mongoose.disconnect(done);
  });

  describe('#addHistory()', function () {
    it('add history field and method', function (done) {
      var user = new UserTest({
        adid: 'test',
        name: 'test user'
      });
      user.get('__updates').should.be.Array;
      user.saveWithHistory.should.be.Function;
      user.saveWithHistory('test', function (err) {
        if (err) {
          debug(err.errors);
          return done(err);
        }
        done();
      });
    });
  });

  describe('#saveWithHistory()', function () {
    it('history contains updates already saved', function (done) {
      UserTest.findOne({
        adid: 'test'
      }, function (err, user) {
        if (err) {
          return done(err);
        }
        user.get('__updates').length.should.equal(1);
        History.findById(user.get('__updates')[0], function (hErr, h) {
          if (hErr) {
            done(hErr);
          }
          debug(user);
          debug(h);
          h.b.should.equal('test');
          h.t.should.equal(user.constructor.modelName);
          h.i.toString().should.equal(user._id.toString());
          h.c.length.should.equal(1);
          h.c[0].p.should.equal('name');
          h.c[0].v.should.equal('test user');
          done();
        });
      });
    });

    it('history contains new updates', function (done) {
      UserTest.findOne({
        adid: 'test'
      }, function (err, user) {
        if (err) {
          return done(err);
        }
        user.office = 'somewhere';
        user.email = 'test@runcheck';
        user.roles.admin = true;
        user.saveWithHistory('test1', function (err, newUser) {
          if (err) {
            return done(err);
          }
          debug(newUser);
          newUser.get('__updates').length.should.equal(2);
          History.findById(newUser.get('__updates')[1], function (hErr, h) {
            if (hErr) {
              done(hErr);
            }
            debug(h);
            h.b.should.equal('test1');
            h.t.should.equal(newUser.constructor.modelName);
            h.i.toString().should.equal(newUser._id.toString());
            h.c.length.should.equal(2);
            var i;
            for (i = 0; i < h.c.length; i += 1) {
              if (h.c[i].p === 'email') {
                h.c[i].v.should.equal('test@runcheck');
              } else {
                h.c[i].p.should.equal('roles.admin');
                h.c[i].v.should.equal(true);
              }
            }
            done();
          });
        });
      });
    });
  });

  describe('#saveHistory()', function () {
    it('save an arbitrary history', function (done) {
      UserTest.findOne({
        adid: 'test'
      }, function (err, user) {
        if (err) {
          return done(err);
        }
        user.office = 'somewhere else';
        user.saveHistory('test1', [{
          p: 'user.office',
          v: 'somewhere else'
        }], function (err, hid) {
          if (err) {
            return done(err);
          }
          History.findById(hid, function (hErr, h) {
            h.b.should.equal('test1');
            h.t.should.equal(user.constructor.modelName);
            h.i.toString().should.equal(user._id.toString());
            h.c.length.should.equal(1);
            h.c[0].p.should.equal('user.office');
            h.c[0].v.should.equal('somewhere else');
            done();
          });
        });
      });
    });
  });
});
