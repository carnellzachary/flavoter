const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Vote = require('../models/Vote');
const Voter = require('../models/Voter');

// @desc    Get all votes
// @route   GET /api/v1/votes
// @route   GET /api/v1/voters/:voterId/votes
// @access  Public
exports.getVotes = asyncHandler(async (req, res, next) => {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    query = Vote.find(JSON.parse(queryStr));

    // Select Fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Voter.countDocuments();

    query = query.skip(startIndex).limit(limit);

    const votes = await query;

    res.status(200).json({
        success: true,
        count: votes.length,
        data: votes
    });
});