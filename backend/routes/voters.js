const express = require('express');
const { getVoters, getVoter, getVotersInRadius, askGPT } = require('../controllers/voters');

const Voter = require('../models/Voter');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router
    .route('/')
    .get(advancedResults(Voter), getVoters)

router
    .route('/radius/:lat/:lng/:distance/:unit')
    .get(getVotersInRadius);

router
    .route('/radius/:lat/:lng/:distance')
    .get(getVotersInRadius);

router
    .route('/askgpt')
    .get(askGPT);

router
    .route('/:id')
    .get(getVoter)

module.exports = router;