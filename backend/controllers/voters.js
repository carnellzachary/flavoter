const OpenAI = require("openai");
const qs = require('qs');
const path = require('path');
const { jsonrepair } = require('jsonrepair');
const ErrorResponse = require('../utils/errorResponse');
const QueryBuilder = require('../utils/queryBuilderAzure');
const QueryResultWriter = require('../utils/queryResultWriter');
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
        geoPoint: { $geoWithin: { $centerSphere: [ [ lng, lat ], radius ] } }
    });

    res.status(200).json({
        success: true,
        count: voters.length,
        data: voters
    });
});

// @desc    Use GPT to translate natural language questions into MongoDB queries
// @route   GET /api/v1/voters/askgpt
// @access  Public
exports.askGPT = asyncHandler(async (req, res, next) => {
    const question = req.query.question;
    const maxAttempts = 3;
    let attempt = 1;
    let errorFeedback = null;
    let response;
    let queryString;

    while (attempt <= maxAttempts) {
        try {
            // Sends the question to GPT to translate it into a query, with optional error feedback
            response = await QueryBuilder.handle(question, errorFeedback, attempt);
           // console.log("Response:", response.function_call.arguments);

            //const parsedResponse = JSON.parse(response.toolCalls[0].function.arguments);

            //console.log(JSON.parse(response.toolCalls[0].function.arguments));

            queryString = response.content;

            console.log('Query:', queryString);

            // Check if it is an actual query or an exception response
            if (queryString[0] !== '[' && queryString[1] !== '{') {
                return res.status(200).json({
                    success: true,
                    result: queryString
                });
            }

            // Check if query string has an ISODate and parse query string
            const parsedQuery = processQueryString(queryString);

            // Define a blacklist of unsafe aggregation operators
            const unsafeOperators = ['$merge', '$out', '$mergeObjects', '$set', '$unset'];

            // Check if any operator in the pipeline is blacklisted
            const hasUnsafeOperator = parsedQuery.some(stage => {
                const operator = Object.keys(stage)[0];
                return unsafeOperators.includes(operator);
            });

            // Return an error if the query contains a blacklisted operator
            if (hasUnsafeOperator) {
                return next(new ErrorResponse('Prohibited aggregation pipeline operator(s) detected', 400));
            }

            // Execute the query
            const queryResult = await Voter.aggregate(parsedQuery);

            // If the result is both an array and not empty, return response with result. Otherwise, continue the loop
            if (Array.isArray(queryResult) && queryResult.length) {
                const queryResultString = JSON.stringify(queryResult);
                const answerStatement = await QueryResultWriter.handle(question, queryString, queryResultString);

                return res.status(200).json({
                    success: true,
                    answer: answerStatement,
                    query: parsedQuery,
                    result: queryResult,
                });
            } else {
                errorFeedback = `For some reason, although the following query did not cause an error, the following query also did not return any results: ${parsedQuery} \n\nThe query was created in response to the following user request: ${question} \n\nPlease reevaluate the query and the user request so that you can modify the query to effectively return a result that address the user request, without sacrificing logic and accuracy.`;

                attempt++;
            }

        } catch (error) {
            console.error(`Error processing request on attempt #${attempt}:`.red.underline.bold, error);
            
            errorFeedback = `There was an error caused by a query you generated in response to a user request. \n\n Here's the user request: ${question}. \n\n\ Here's the query that caused an error: ${queryString} \n\n And here's the error message: "${error.message}" \n\nPlease reevaluate the query and construct a new query that addresses the user request, without repeating the same mistakes and causing an error.`;

            attempt++;
        }
    }

    return next(new ErrorResponse('Error processing your request after three attempts', 500));
}); 

// Handles ISODates, which are not valid JSON, and parses query string
function processQueryString(queryString) {
    // Step 1: Replace ISODate() with a placeholder
    const isoDateRegex = /ISODate\("([^"]+)"\)/g;
    let match;
    const replacements = [];

    // Collecting all ISODate strings for replacement
    while ((match = isoDateRegex.exec(queryString)) !== null) {
        replacements.push({
            placeholder: `"ISODatePlaceholder${replacements.length}"`,
            date: new Date(match[1])
        });
    }

    // Replacing all ISODate instances with placeholders in a single pass
    replacements.forEach(replacement => {
        queryString = queryString.replace(/ISODate\("([^"]+)"\)/, replacement.placeholder);
    });

    // console.log("\nReplaced query string:", queryString);

    // Step 2: Parse the modified query string as JSON
    let query;
    try {
        query = JSON.parse(queryString);
    } catch (err) {
        console.log(`Error parsing query string:`.red.underline.bold + ` ${err}` + `\n\nAttempting to jsonrepair query string...`.yellow);

        try {
            const repairedQueryString = jsonrepair(queryString);
            query = JSON.parse(repairedQueryString);
          } catch (e) {
            console.error("Failed to parse JSON after repairing:".red.underline.bold, e);
        }
    }

    // Step 3: Replace placeholders with Date objects
    function replacePlaceholders(value) {
        if (typeof value === 'string' && value.startsWith('ISODatePlaceholder')) {
            const index = parseInt(value.replace('ISODatePlaceholder', ''), 10);
            return replacements[index].date;
        }
        return value;
    }


    function deepReplace(object) {
        for (let key in object) {
            if (typeof object[key] === 'string') {
                object[key] = replacePlaceholders(object[key]);
            } else if (typeof object[key] === 'object' && object[key] !== null) {
                deepReplace(object[key]);
            }
        }
    }

    deepReplace(query);

    return query;
}