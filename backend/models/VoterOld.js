const mongoose = require('mongoose');
const slugify = require('slugify');

// Add enums, requireds, trims, maxlengths, defaults, etc
const VoterSchema = new mongoose.Schema(
  {
    voter_id: {
      type: String,
      required: true
    },
    party: String,
    voterStatus: String,
    exempt: String,
    votes: {
      type: Array,
      countyVotedIn: String,
      electionDate: String,
      electionType: String,
      historyCode: String
    },
    profile: {
      suffix: String,
      firstName: String,
      middleName: String,
      lastName: String,
      dob: Date,
      gender: String,
      race: Number
    },
    address: {
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
    },
    geoloc: {
      // GeoJSON Point
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number],
        index: '2dsphere'
      },
      matching: String,
      exactness: String,
      outputAddress: String,
      tigerId: String,
      tigerIdSide: String,
      countyCode: String,
      tractCode: String,
      blockCode: String,
      streetInput: String,
      cityInput: String,
      zipInput: String
    }
  });

module.exports = mongoose.model('Voter', VoterSchema);