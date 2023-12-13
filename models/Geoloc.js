const mongoose = require('mongoose');

const GeolocSchema = new mongoose.Schema({
    matching: String,
    exactness: String,
    outputAddress: String,
    tiger_id: Number,
    tiger_id_side: String,
    countyCode: Number,
    tractCode: Number,
    blockCode: Number,
    streetInput: String,
    cityInput: String,
    zipInput: String,
    geoPoint: {
        type: {
            type: String, 
            enum: ['Point'], 
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
});

module.exports = mongoose.model('Geoloc', GeolocSchema);