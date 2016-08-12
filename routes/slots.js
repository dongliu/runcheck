var express = require('express');
var slots = express.Router();
var auth = require('../lib/auth');
var Slot = require('../models/slot').Slot;
var log = require('../lib/log');

slots.get('/', auth.ensureAuthenticated, function (req, res) {
  res.render('slots');
});

slots.get('/json', auth.ensureAuthenticated, function (req, res) {
  var slotDocs = [];
  Slot.find(function (err, docs) {
    if (err) {
      log.error(err);
      return res.status(500).send(err.message);
    }
    var count = 0;
    // data just for test.
    docs.forEach(function(d) {
      var slotDoc = {
        _id: d._id,
        name: d.name,
        owner: 'wen',
        area: 'unknow in xlsx',
        level: d.level,
        deviceType: d.deviceType,
        location: [d.coordinateX, d.coordinateY, d.coordinateZ],
        device: d.deviceNaming,
        approvalStatus: 'unknow in xlsx',
        machineMode: 'unknow in xlsx',
        ReadinessCheckedValue: 10,
        ReadinessTotalValue: 10,
        DRRCheckedValue: 4,
        DRRTotalValue: 10,
        ARRCheckedValue: 0,
        ARRTotalValue:10
      };
      slotDocs.push(slotDoc);
      count = count + 1;
      if(count === docs.length) {
        res.status(200).json(slotDocs);
      }
    });
  });

});

module.exports = slots;
