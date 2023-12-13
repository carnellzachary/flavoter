const express = require('express');
const { getVoters, getVoter } = require('../controllers/voters');

const Voter = require('../models/Voter');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
    .route('/')
    .get(getVoters)

router
    .route('/:id')
    .get(getVoter)

module.exports = router;