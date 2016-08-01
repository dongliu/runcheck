var XLSX = require('xlsx');
var sutil = require('./utils');
var Slot = require('../models/slot').Slot;
var slotSchema = require('../models/slot').slotSchema;
var config = require('../config/config.js');
var log = require('../lib/log');
var async = require('async');

// mongoDB starts
var mongoose = require('mongoose');

var mongoURL = 'mongodb://' + (config.mongo.address || 'localhost') + ':' + (config.mongo.port || '27017') + '/' + (config.mongo.db || 'runcheck');
mongoose.connect(mongoURL);
mongoose.connection.on('connected', function () {
  log.info('Mongoose default connection opened.');
});
mongoose.connection.on('error', function (err) {
  log.error('Mongoose default connection error: ' + err);
});
mongoose.connection.on('disconnected', function () {
  log.warn('Mongoose default connection disconnected');
});
// mongoDB ends


/*                 Config starts              */
var force = false; // Save data is forbidden, if DB already had slots data
var fileName = 'slot-data.xlsx';
var slotFieldList =   [ ['system', 'System'],
  ['subsystem', 'Sub-\r\nsystem'],
  ['deviceNaming', 'Device'],
  ['beamlinePosition', 'Beam line position (dm)'],
  ['name', 'Name'],
  ['deviceType', 'Device Type'],
  ['elementName', 'Element Name'],
  ['level', 'Level of Care'],
  ['DRR', 'Associated DHR'],
  ['ARR', 'Associated ARR'],
  ['InnerDiameter', 'Minimum Beam Pipe Inner Diameter (mm)'],
  ['flangeLength', 'Element Flange to Flange Length (m)'],
  ['placeHolder', 'PLACE HOLDER '],
  ['effectiveLength', 'Element Effective Length (m)'],
  ['coordinateZ', 'Global Coordinate Z (m)'],
  ['coordinateY', 'Global Coordinate Y (m)'],
  ['coordinateX', 'Global Coordinate X (m)'],
  ['center2centerLength', 'Accumulated center-to-center Length (m)'],
  ['end2endLength', 'Accumulated end-to-end Length (m)'],
  ['comment', 'Comment']
];
/*                 Config end              */


// Read slot data from file
var workbook = XLSX.readFile(fileName);
var branch1 = workbook.Sheets['branch1'];
var branch2 = workbook.Sheets['branch2'];
// merge branch1 and branch2
var slots = XLSX.utils.sheet_to_json(branch1);
var slots2 = XLSX.utils.sheet_to_json(branch2);
slots.push(slots2);

sutil.fieldFixed(slots, slotSchema, slotFieldList);
// delete object that (system || subsystem || beamlinePosition) is empty
slots = slots.filter(function(x) {
  return x.system && x.subsystem && x.beamlinePosition ? true: false;
});

function saveSlot(s,callback) {
  var sobj = new Slot(s);
  // convert string to ObjectId
  sobj.DRR = mongoose.Types.ObjectId(sobj.DRR);
  sobj.ARR = mongoose.Types.ObjectId(sobj.ARR);
  sobj.save(function (err,doc) {
    if (err) {
      log.error(err);
      mongoose.connection.close();
      process.exit(1);
    }
    console.log(doc.name + ' saved');
    callback();
  });
}

// check if there is slot collection
mongoose.connection.on('open', function () {
  mongoose.connection.db.listCollections({name: 'slots'})
    .next(function(err, collinfo) {
      if (collinfo && force === false) {
        console.error('Forbiden, DB already has slots data. Please set force = true, if you want to continue to import data.');
        mongoose.connection.close();
      }else {
        // Save Data
        async.each(slots, saveSlot, function() {
          console.log('Success, all data saved.');
          mongoose.connection.close();
        });
      }
    });
});