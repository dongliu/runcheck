var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var user = new Schema({
  _id: String,
  name: String,
  email: String,
  office: String,
  phone: String,
  mobile: String,
  roles: [String],
  lastVisitedOn: Date,
  devices: [ObjectId],
  slots: [ObjectId],
  slotgroups: [ObjectId],
  checklists: [ObjectId],
  subscribe: {
    type: Boolean,
    default: false
  }
});

var User = mongoose.model('User', user);
module.exports = {
  User: User
};
