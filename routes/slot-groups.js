var express = require('express');
var slotGroups = express.Router();
var auth = require('../lib/auth');
var SlotGroup = require('../models/slot-group').SlotGroup;
var Slot = require('../models/slot').Slot;
var reqUtils = require('../lib/req-utils');
var log = require('../lib/log');

slotGroups.get('/', auth.ensureAuthenticated, function (req, res) {
  res.render('slot-groups');
});


slotGroups.get('/json', auth.ensureAuthenticated, function (req, res) {
  SlotGroup.find(function(err, docs) {
    if (err) {
      log.error(err);
      return res.status(500).send(err.message);
    }
    res.status(200).json(docs);
  });
});


slotGroups.get('/:id', auth.ensureAuthenticated, function (req, res) {
  res.render('slot-group');
});

slotGroups.get('/:id/json', auth.ensureAuthenticated, function (req, res) {
  SlotGroup.findOne({_id: req.params.id },function(err, doc) {
    if (err) {
      log.error(err);
      return res.status(500).send(err.message);
    }
    res.status(200).json(doc);
  });
});


slotGroups.get('/:id/slots', auth.ensureAuthenticated, function (req, res) {
  SlotGroup.findOne({ _id: req.params.id },{ slots: 1, _id: 0 }, function(err, doc) {
    if (err) {
      log.error(err);
      return res.status(500).send(err.message);
    }
    Slot.find({ _id: {$in: doc.slots }},function(err, docs) {
      if (err) {
        log.error(err);
        return res.status(500).send(err.message);
      }
      res.status(200).json(docs);
    });
  });
});


/*
 Validation for adding slot to group, return json data:
 {
 passData:{ // slot Ids can be added
   id:
   name:
   }
 conflictDataName: {
    slot: // conflict slot name
    conflictGroup:// conflict slot group name
   }
 }
 */
slotGroups.post('/validateAdd', auth.ensureAuthenticated, function (req, res) {
  var passData = [];
  var conflictDataName = [];
  var count = 0;
  Slot.find({
    '_id': {$in: req.body.slotIds}
  }, function (err, docs) {
    if (err) {
      log.error(err);
      return res.status(500).send(err.message);
    }
    // divied two parts by inGroup field
    var conflictData = [];
    docs.forEach(function (d) {
      if (d.inGroup) {
        conflictData.push(d);
      } else {
        passData.push({id: d._id,
          name: d.name});
      }
    });

    if(conflictData.length > 0) {
      conflictData.forEach(function (r) {
        SlotGroup.findOne({'_id': r.inGroup}, function(err, conflictGroup) {
          conflictDataName.push({
            slot: r.name,
            conflictGroup: conflictGroup.name
          });
          count = count + 1;
          if (count === conflictData.length) {
            res.status(200).json({
              passData: passData,
              conflictDataName: conflictDataName
            });
          }
        });
      });
    }else {
      res.status(200).json({
        passData: passData,
        conflictDataName: conflictDataName
      });
    }
  });
});

slotGroups.post('/:gid/slots', auth.ensureAuthenticated, reqUtils.exist('gid', SlotGroup), reqUtils.exist('sid', Slot, '_id', 'body'), function (req, res) {
  // check whether slot is not in slot group
  if (req[req.params.gid].slots.indexOf(req.body.sid) !== -1) {
    return res.status(409).send('Conflict: slot ' + req.body.sid + ' is in slot group ' + req.params.gid);
  }
  // check whether slot.inGroup is null
  if (req[req.body.sid].inGroup) {
    return res.status(409).send('Conflict: the inGroup field in group of ' + req.params.gid + ' is not null.');
  }

  // add to .slots
  req[req.params.gid].slots.addToSet(req.body.sid);
  req[req.params.gid].save(function(err) {
    if (err) {
      log.error(err);
      return res.status(500).send(err.message);
    }
    // change inGroup
    req[req.body.sid].inGroup = req.params.gid;
    req[req.body.sid].save(function(err) {
      if (err) {
        log.error(err);
        return res.status(500).send(err.message);
      }
      var url = '/slotGroups/' + req.params.gid + '/slots/' + req.body.sid;
      res.location(url);
      return res.status(201).end();
    })
  });
});


slotGroups.delete('/:gid/slots/:sid', auth.ensureAuthenticated, reqUtils.exist('gid', SlotGroup), reqUtils.exist('sid', Slot), function (req, res) {
  // check whether slot is in slot group
  if (req[req.params.gid].slots.indexOf(req.params.sid) === -1) {
    return res.status(409).send('Conflict: slot ' + req.params.sid + ' is not in slot group ' + req.params.gid);
  }
  // check whether slot.inGroup is not null
  if (!req[req.params.sid].inGroup) {
    return res.status(409).send('Conflict: the inGroup field in group of ' + req.params.gid + ' is null.');
  }
  // temparay soltuton for version error
  SlotGroup.update({_id: req.params.gid},{ $pull: {slots: req.params.sid} }, function(err) {
    if (err) {
      log.error(err);
      return res.status(500).send(err.message);
    }
    Slot.update({_id: req.params.sid},{inGroup: null}, function(err){
      if (err) {
        log.error(err);
        return res.status(500).send(err.message);
      }
      return res.status(200).end();
    });
  });
});

module.exports = slotGroups;