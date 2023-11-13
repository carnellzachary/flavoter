const express = require('express');
const { getVotes } = require('../controllers/votes');

const Vote = require('../models/Vote');

// Maybe don't mergeParams with leanVirtuals? Check
const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router
    .route('/')
    .get(getVotes)

module.exports = router;