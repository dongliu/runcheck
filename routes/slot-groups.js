var express = require('express');
var slotGroups = express.Router();
var auth = require('../lib/auth');
var SlotGroup = require('../models/slot-group').SlotGroup;
var Slot = require('../models/slot').Slot;
var reqUtils = require('../lib/req-utils');

slotGroups.get('/', auth.ensureAuthenticated, function (req, res) {
  res.render('slot-groups');
});


slotGroups.get('/json', auth.ensureAuthenticated, function (req, res) {
  SlotGroup.find(function(err, docs) {
    if (err) {
      console.error(err);
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
      console.error(err);
      return res.status(500).send(err.message);
    }
    res.status(200).json(doc);
  });
});


slotGroups.get('/:id/slots', auth.ensureAuthenticated, function (req, res) {
  SlotGroup.findOne({ _id: req.params.id },{ slots: 1, _id: 0 }, function(err, doc) {
    if (err) {
      console.error(err);
      return res.status(500).send(err.message);
    }
    Slot.find({ _id: {$in: doc.slots }},function(err, docs) {
      if (err) {
        console.error(err);
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
      console.error(err);
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

slotGroups.post('/addSlots', auth.ensureAuthenticated, reqUtils.exist('gid', SlotGroup, 'body'), reqUtils.exist('sid', Slot, 'body'), function (req, res) {
  // check whether slot is not in slot group
  if (req[req.body.gid].slots.indexOf(req.body.sid) !== -1) {
    return res.status(403).send('Can not add: Slot ' + req.body.sid + ' is in slot group ' + req.body.gid);
  }
  // check whether slot.inGroup is null
  if (req[req.body.sid].inGroup) {
    return res.status(403).send('Can not add: The inGroup field in group of ' + req.body.gid + ' is not null.');
  }

  // add to .slots
  req[req.body.gid].slots.addToSet(req.body.sid);
  req[req.body.gid].save(function(err) {
    if (err) {
      console.error(err);
      return res.status(500).send(err.message);
    }
    // change inGroup
    req[req.body.sid].inGroup = req.body.gid;
    req[req.body.sid].save(function(err) {
      if (err) {
        console.error(err);
        return res.status(500).send(err.message);
      }
      var url = '/slotGroups/' + req.body.gid + '/slot/' + req.body.sid;
      res.location(url);
      return res.status(201).end();
    })
  });
});


slotGroups.delete('/:gid/slot/:sid', auth.ensureAuthenticated, reqUtils.exist('gid', SlotGroup), reqUtils.exist('sid', Slot), function (req, res) {
  // check whether slot is in slot group
  if (req[req.params.gid].slots.indexOf(req.params.sid) === -1) {
    return res.status(403).send('Can not remove: Slot ' + req.params.sid + ' is not in slot group ' + req.params.gid);
  }
  // check whether slot.inGroup is not null
  if (!req[req.params.sid].inGroup) {
    return res.status(403).send('Can not remove: The inGroup field in group of ' + req.params.gid + ' is null.');
  }

  SlotGroup.findOneAndUpdate({_id: req.params.gid},{ $pull: {slots: req.params.sid} }, function(err) {
    if (err) {
      console.error(err);
      return res.status(500).send(err.message);
    }
    Slot.update({_id: req.params.sid},{inGroup: null}, function(err){
      if (err) {
        console.error(err);
        return res.status(500).send(err.message);
      }
      return res.status(200).end();
    });

  // pull to .slots
/*  console.log('$$: sid' + req.params.sid + '    version: ' + req[req.params.gid].__v);
  // req[req.params.gid].slots.pull(req.params.sid);
  req[req.params.gid].save(function(err,gdoc) {
    if (err) {
      console.error(err);
      return res.status(500).send(err.message);
    }
    req[req.params.gid] = gdoc; // solve VersionError
    // change inGroup to null
    req[req.params.sid].inGroup = null;
    req[req.params.sid].save(function(err, sdoc) {
      if (err) {
        console.error(err);
        return res.status(500).send(err.message);
      }
      req[req.params.gid] = sdoc; // solve VersionError
      return res.status(200).end();
    })*/
  });
});

module.exports = slotGroups;