var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var slot = new Schema({
  system: String,
  subsystem: String,
  deviceNaming: String,// mapping to device column in slot excel file
  beamlinePosition: Number,// Beam line position (dm)
  name: String,
  deviceType: String,
  elementName: String,
  area: String, // not in slot excel file
  level: {
    type: String,
    default: 'Low',
    enum: ['Low', 'Medium', 'High']
  },
  approvalStatus: {// not in slot excel file
    type: Boolean,
    default: false
  },
  device: ObjectId,
  DRR: ObjectId,
  ARR: ObjectId,
  machineMode: String,// not in slot excel file
  InnerDiameter: String,// Minimum Beam Pipe Inner Diameter (mm)
  flangeLength: Number,// Element Flange to Flange Length (m)
  placeHolder: Number,
  effectiveLength: Number,// Element Effective Length (m)
  coordinateX: Number,// Global Coordinate X (m)
  coordinateY: Number,
  coordinateZ: Number,
  center2centerLength: Number,// Accumulated center-to-center Length (m)
  end2endLength: Number,// Accumulated end-to-end Length (m)
  comment: String,
  artemisDistance: Number// Distance from Artemis source (m)
});

var Slot = mongoose.model('Slot', slot);

module.exports = {
  Slot: Slot,
  slotSchema: slot
};