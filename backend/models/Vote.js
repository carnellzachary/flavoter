const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
    countyCode: {
        type: String,
        required: [true, 'Missing countyCode'],
        trim: true,
        maxlength: [3, 'countyCode cannot be more than 3 characters']
    },
    voter_id: {
        type: Number,
        ref: 'Voter', // Which model to reference
        required: true
    },
    electionDate: Date,
    electionType: String,
    historyCode: String
});

module.exports = mongoose.model('Vote', VoteSchema);