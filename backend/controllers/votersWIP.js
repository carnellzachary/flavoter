const OpenAI = require("openai");
const qs = require('qs');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const QueryBuilder = require('../utils/queryBuilderWIP');
const asyncHandler = require('../middleware/async');
const Voter = require('../models/Voter');

// @desc    Get all voters
// @route   GET /api/v1/voters
// @access  Public
exports.getVoters = asyncHandler(async (req, res, next) => {  
    res.status(200).json(res.advancedResults);
});

// @desc    Get single voter
// @route   GET /api/v1/voters/:id
// @access  Public
exports.getVoter = asyncHandler(async (req, res, next) => {
    const voter = await Voter.findOne({ voter_id: req.params.id });

    // If id formatted correctly but doesn't exist
    if (!voter) {
        // return res.status(400).json({ success: false });
        return next(new ErrorResponse(`Voter not found with id of ${req.params.id}`, 404));
    } 
        
    res.status(200).json({ success: true, data: voter });
});

// @desc    Get voters within a radius
// @route   GET /api/v1/voters/radius/:zipcode/:distance
// @route   GET /api/v1/voters/radius/:lat/:lng/:distance
// @route   GET /api/v1/voters/radius/:lat/:lng/:distance/:unit
// @access  Private
exports.getVotersInRadius = asyncHandler(async (req, res, next) => {
    // Get parameters from request
    const { unit, distance, lat, lng } = req.params;
    const reqUnit = (!unit) ? 'FEET' : unit.toUpperCase();  
    
    // Default to feet  
    let radius = distance / 20902464.03976;

    // Calc radius using radians
    // Divide distance by radius of Earth
    // Earth radius = 3,963 mi or 6,378 km or 20902464.03976 feet or 6371000 meters
    if (reqUnit === 'METERS' || reqUnit === 'METER' || reqUnit === 'M') {
        radius = distance / 6371000;
    } else if (reqUnit === 'MILES' || reqUnit === 'MILE' || reqUnit === 'MI') {
        radius = distance / 3958.8;
    } else if (reqUnit === 'KILOMETERS' || reqUnit === 'KILOMETER' || reqUnit === 'KM') {
        radius = distance / 6371;
    } 

    // Harcoding UF coords for testing, change later
    const voters = await Voter.find({
        geoloc: { $geoWithin: { $centerSphere: [ [ lng, lat ], radius ] } }
    });

    res.status(200).json({
        success: true,
        count: voters.length,
        data: voters
    });
});

// @desc    Use GPT to translate natural language quesitons into MongoDB queries
// @route   GET /api/v1/voters/askgpt
// @access  Public
exports.askGPT = asyncHandler(async (req, res, next) => {
    const question = req.query.question;
    let queryResponse;

    try {
        // First attempt to generate and execute the query
        queryResponse = await QueryBuilder.handle(question, errorMessage = null);

        console.log('Response: ' + JSON.stringify(queryResponse));

        queryResponse = JSON.parse(queryResponse);

        const result = await executeQuery(queryResponse.query);
        sendSuccessResponse(res, queryResponse, result);
    } catch (error) {
        console.error("Error processing request on first try:", error);

        // Retry with error message
        try {
            const queryResponse = await generateQuery(question, error.message);
            const result = await executeQuery(queryResponse.query);
            sendSuccessResponse(res, queryResponse, result);
        } catch (retryError) {
            // If the retry also fails, send the error response
            console.error("Error after retry:", retryError);
            return next(new ErrorResponse('Error processing your request after retry', 500));
        }
    }
});

async function generateQuery(question, errorMessage = null) {
    const queryResponse = await QueryBuilder.handle(question, errorMessage);
    return JSON.parse(queryResponse);
}

async function executeQuery(queryResponse) {
    let aggregationPipeline;
    try {
        aggregationPipeline = JSON.parse(queryResponse.query);
    } catch (jsonParseError) {
        console.error("JSON Parsing Error:", jsonParseError);
        throw new Error('Invalid query format received from GPT');
    }

    // Define a blacklist of unsafe aggregation operators
    const unsafeOperators = ['$merge', '$out', '$mergeObjects', '$addFields', '$set', '$unset'];

    // Check if any operator in the pipeline is blacklisted
    const hasUnsafeOperator = aggregationPipeline.some(stage => {
        const operator = Object.keys(stage)[0];
        return unsafeOperators.includes(operator);
    });

    if (hasUnsafeOperator) {
        throw new Error('Prohibited aggregation pipeline operator(s) detected');
    }

    return await Voter.aggregate(aggregationPipeline);
}

function sendSuccessResponse(res, queryResponse, result) {
    const dataResult = extractDataResultFromResponse(result);
    const answer = queryResponse.answer.replace('{data_result}', dataResult.toString());

    res.status(200).json({
        success: true,
        query: queryResponse.query,
        data: result,
        dataResult: dataResult,
        answer: answer
    });
}

function extractDataResultFromResponse(arr) {
    let dataResult = null;

    // Check if 'arr' is an array with at least one item
    if (Array.isArray(arr) && arr.length > 0) {
        const firstItem = arr[0]; // Assuming there is only one object in the 'data' array
        if (typeof firstItem === 'object') {
            // Iterate over the properties of the first object
            for (const key in firstItem) {
                if (Object.hasOwnProperty.call(firstItem, key)) {
                    // Check if the property's value is a number or a string (you can adjust this condition as needed)
                    if (typeof firstItem[key] === 'number' || typeof firstItem[key] === 'string') {
                        // Assign the first property with a valid value to 'dataResult' and break the loop
                        dataResult = firstItem[key];
                        break;
                    }
                }
            }
        }
    }

    return dataResult;
}

  