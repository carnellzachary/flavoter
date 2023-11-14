const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder');

// Add enums, requireds, trims, maxlengths, defaults, etc
const VoterSchema = new mongoose.Schema(
  {
    voter_id: {
      type: Number,
      required: true
    },
    party: String,
    voterStatus: String,
    exempt: String,
    profile: {
      suffix: String,
      firstName: String,
      middleName: String,
      lastName: String,
      dob: Date,
      gender: String,
      race: Number
    },
    location: {
      addr1: String,
      addr2: String,
      city: String,
      state: String,
      zip: String,
      mailAddr1: String,
      mailAddr2: String,
      mailAddr3: String,
      mailCity: String,
      mailState: String,
      mailZip: String,
      mailCountry: String
    },
    contact: {
      phoneArea: String,
      phoneNumber: String,
      phoneExtension: String,
      email: String
    },
    district: {
      countyCode: String,
      congressionalDistrict: String,
      houseDistrict: String,
      senateDistrict: String,
      schoolBoardDistrict: String,
      precinct: String,
      precinctGroup: String,
      precinctSplit: String,
      precinctSuffix: String
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

  // Reverse populate with virtuals
  VoterSchema.virtual('votes', {
     ref: 'Vote',
     localField: 'voter_id',
     foreignField: 'voter_id',
     justOne: false
  });

  // Test lean virtual (replace with vote and geoloc virtuals)
  // VoterSchema.virtual('profile.lowercaseLast').get(function() {
  //   return this.profile.lastName.toLowerCase();
  // });
  
  // Now, the `lowercase` property will show up even if you do a lean query
  VoterSchema.plugin(mongooseLeanVirtuals);

  module.exports = mongoose.model('Voter', VoterSchema);