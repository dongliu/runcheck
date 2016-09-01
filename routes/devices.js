var express = require('express');
var devices = express.Router();
var auth = require('../lib/auth');
var Device = require('../models/device').Device;
var Slot = require('../models/slot').Slot;
var checklistValues = require('../models/checklist').checklistValues;
var checklistSubjects = require('../models/checklist').deviceChecklistSubjects;
var log = require('../lib/log');

devices.get('/', auth.ensureAuthenticated, function (req, res) {
  res.render('devices');
});


devices.get('/json', auth.ensureAuthenticated, function (req, res) {
  Device.find(function (err, devices) {
    if (err) {
      return res.status(500).json({
        error: {
          status: err
        }
      });
    }
    return res.status(200).json(devices);
  });
});


devices.get('/:id', auth.ensureAuthenticated, function (req, res) {
  Device.findById(req.params['id'], function (err, device) {
    if (err) {
      return res.status(404).render('error', {
        error: {
          status: err
        }
      });
    }
    return res.render('device', {
      device: device,
      checklistValues: checklistValues,
      checklistSubjects: checklistSubjects
    });
  });
});


devices.post('/:id', auth.ensureAuthenticated, function (req, res) {
  Device.findById(req.params['id'], function (err, device) {
    var idx, item, subject, status = 404;
    var nRequired = 0, nChecked = 0;
    if (err) {
      return res.status(status).render('error', {
        error: {
          status: err
        }
      });
    }
    if (req.body['action'] === 'require-checklist') {
      if (device.checklist) {
        status = 200;
        // checklist already created
        device.checklist.required = true;
      } else {
        status = 201;
        // create checklist based on its schema
        device.checklist = { required: true };
      }
    }
    if (req.body['action'] === 'config-checklist') {
      for (idx in checklistSubjects) {
        subject = checklistSubjects[idx];
        item = device.checklist[subject];
        if (item.required !== undefined) {
          if (req.body[subject] && req.body[subject] === 'true') {
            item.required = true;
          } else {
            item.required = false;
          }
        }
        // need to update the total required and checked
        if (item.required != false) {
          nRequired += 1;
          if ((item.value === 'Y') || (item.value === 'YC') ) {
            nChecked += 1;
          }
        }
      }
      device.totalValue = nRequired;
      device.checkedValue = nChecked;
      status = 200;
    }
    if (req.body['action'] === 'update-checklist') {
      for (idx in checklistSubjects) {
        subject = checklistSubjects[idx];
        item = device.checklist[subject];
        if (req.body[subject]) {
          item.value = req.body[subject];
        }
        // need to update the total required and checked
        if (item.required !== false) {
          nRequired += 1;
          if ((item.value === 'Y') || (item.value === 'YC')) {
            nChecked += 1;
          }
        }
      }
      device.totalValue = nRequired;
      device.checkedValue = nChecked;
      status = 200;
    }
    // TODO: save the device to the db
    res.status(status).render('device', {
      device: device,
      checklistValues: checklistValues,
      checklistSubjects: checklistSubjects
    });
  });
});


devices.get('/:id/json', auth.ensureAuthenticated, function (req, res) {
  Device.findById(req.params['id'], function (err, device) {
    if (err) {
      log.error(err);
      return res.status(500).send(err.message);
    }
    res.status(200).json(device);
  });
});


devices.put('/:id/installToDevice', auth.ensureAuthenticated, function (req, res) {
  Device.findOne({_id: req.params.id}, function (err, device) {
    if (err) {
      log.error(err);
      return res.status(500).send(err.message);
    }
    if (!device) {
      return res.status(404).send('No device found with _id' + req.params.id);
    }
    // check status
    if (!req.body.targetId) { // to spare
      if (!device.installToDevice || device.status === 0) {
        return res.status(409).send('Device has been uninstalled or status is spare.');
      }
    } else { // to install
      if (device.installToDevice || device.installToSlot || device.status !== 0) {
        return res.status(409).send('Device has been installed or status not spare.');
      }
    }
    // update
    if(!req.body.targetId) {
      device.installToDevice = null;
      device.status = 0;
    }else {
      device.installToDevice = req.body.targetId;
      device.status = 1;
    }
    device.save(function(err, newDevice) {
      if (err) {
        log.error(err);
        return res.status(500).send(err.message);
      }
      return res.status(200).send(newDevice)
    })
  })
});


// TODO: MongoDB transaction
devices.put('/:id/installToSlot', auth.ensureAuthenticated, function (req, res) {
  Device.findOne({_id: req.params.id}, function (err, device) {
    if (err) {
      log.error(err);
      return res.status(500).send(err.message);
    }
    if (!device) {
      return res.status(404).send('No device found with _id' + req.params.id);
    }
    // check device
    if(!req.body.targetId) { // to spare
      if(!device.installToSlot || device.status === 0) {
        return res.status(409).send('Device has been uninstalled or status is spare.');
      }
    }else { // to install
      if(device.installToSlot || device.installToDevice || device.status !== 0) {
        return res.status(409).send('Device has been installed or status not spare.');
      }
    }
    var preInstallToSlot = device.installToSlot;
    // check slot
    var slotCondition = req.body.targetId? { _id: req.body.targetId}: {_id: preInstallToSlot};
    Slot.findOne(slotCondition, function(err, slot){
      if (err) {
        log.error(err);
        return res.status(500).send(err.message);
      }
      if (!slot) {
        return res.status(404).send('No slot found with id ' + slotCondition._id);
      }
      if (!req.body.targetId && !slot.device) {
        return res.status(409).send('slot is spare.');
      }
      if (req.body.targetId && slot.device) {
        return res.status(409).send('slot is not spare, ' + 'installed with ' + slot.device);
      }
      // update device
      if(!req.body.targetId) {
        device.installToSlot = null;
        device.status = 0;
      }else {
        device.installToSlot = req.body.targetId;
        device.status = 1;
      }
      device.save(function(err, newDevice) {
        if (err) {
          log.error(err);
          return res.status(500).send(err.message);
        }
        slot.device = req.body.targetId? req.params.id: null;
        slot.save(function (err) {
          if (err) {
            log.error(err);
            log.error('Slot ' + slotCondition._id + ' is inconsistent with device ' + newDevice._id);
            return res.status(500).send(err.message);
          }
          return res.status(200).json(newDevice);
        })
      });
    });
  });
});


devices.put('/:id/status/:status', auth.ensureAuthenticated, checkStatusTransition, function (req, res) {
  req.params.device.status = req.params.status;
  req.params.device.save(function (err, newDevice) {
    if (err) {
      log.error(err);
      return res.status(500).send(err.message);
    }
    return res.status(200).json(newDevice);
  });
});


/**
 * check device status transition
 * @param req
 * @param res
 * @param next
 * @returns {*}   400 404 500 error message
 */
function checkStatusTransition(req, res, next) {
  var transition = [
    '1-1.5',
    '1-2',
    '1.5-2',
    '2-3'
  ];
  Device.findOne({_id: req.params.id},function(err, device){
    if (err) {
      log.error(err);
      return res.status(500).send(err.message);
    }
    if (!device) {
      return res.status(404).send('No device found with id' + req.params.id);
    }
    var tran = device.status + '-' + req.params.status;
    if(transition.indexOf(tran) === -1) {
      return res.status(400).send('Forbidden to set status value from ' + req.params.oldStatus + ' to ' + req.params.newStatus);
    }
    req.params.device = device;
    next();
  });
}

module.exports = devices;