const OpenAI = require("openai");
const qs = require('qs');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const QueryBuilder = require('../utils/queryBuilderAzure');
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
/*
exports.askGPT = asyncHandler(async (req, res, next) => {
    const question = req.query.question;
    let errorFeedback = null;
    const maxAttempts = 3;
    let attempt = 1;

    while (attempt <= 1) {
        try {
            // Sends the question to GPT to translate it into a query, with optional error feedback
            const response = await QueryBuilder.handle(question, errorFeedback);

            console.log(response);
            const gptResponse = JSON.parse(response);
            const aggregationPipeline = JSON.parse(gptResponse.content);

            // Define a blacklist of unsafe aggregation operators
            const unsafeOperators = ['$merge', '$out', '$mergeObjects', '$addFields', '$set', '$unset'];

            // Check if any operator in the pipeline is blacklisted
            const hasUnsafeOperator = aggregationPipeline.some(stage => {
                const operator = Object.keys(stage)[0];
                return unsafeOperators.includes(operator);
            });

            // Return an error if the query contains a blacklisted operator
            if (hasUnsafeOperator) {
                return next(new ErrorResponse('Prohibited aggregation pipeline operator(s) detected', 400));
            }

            // Execute the query
            const result = await Voter.aggregate(aggregationPipeline);

            // Data result for natural language answer
            // const dataResult = extractDataResultFromResponse(result);

            // If execution is successful, break out of the loop
            return res.status(200).json({
                success: true,
                query: aggregationPipeline,
                result: result
            });

        } catch (error) {
            console.error("Error processing request:", error);

            // Check for invalid query parameters
            const prevQuery = aggregationPipeline ? JSON.stringify(aggregationPipeline, null, 2) : 'N/A';
            
            errorFeedback = `There was an error caused by a query you previously generated to answer this prompt: ${question}. Please generate a DIFFERENT query that answers the prompt and DOES NOT repeat the mistakes of the previous query so that it doesn't cause an error. \n\nPrevious Query: ${queryString} \n\nError Message: ${error.message}`;

            // Capture the last query along with the error message for feedback
            // console.log(`\n --- Attempt #${attempt.toString()} --- \n`.yellow.underline + errorFeedback + "\n");

            attempt++;
        }
    }

    return next(new ErrorResponse('Error processing your request', 500));
});
*/

exports.askGPT = asyncHandler(async (req, res, next) => {
    const question = req.query.question;
    let errorFeedback = null;
    let aggregationPipeline = null;
    const maxAttempts = 3; // Three attempts
    let attempt = 1;
    let response;
    let queryString;
    let processedQueryString;

    while (attempt <= maxAttempts) {
        try {
            // Sends the question to GPT to translate it into a query, with optional error feedback
            response = await QueryBuilder.handle(question, errorFeedback);
           // console.log("Response:", response.function_call.arguments);

            const queryString = response.content;

            console.log(queryString);

            // console.log("Query String: " + queryString);

            // Process the query string first
            // processedQueryString = prepareMongoQuery(queryString);

            // Then parse it as JSON
            // aggregationPipeline = JSON.parse(queryResponse.query);

            // console.log("aggregationPipeline:", aggregationPipeline);

            // const gptAnswer = queryResponse.answer;

            // Check if query string has an ISODate
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
            const result = await Voter.aggregate(parsedQuery);

            // Data result for natural language answer
            // const dataResult = extractDataResultFromResponse(result);

            // If execution is successful, break out of the loop
            return res.status(200).json({
                success: true,
                query: parsedQuery,
                result: result
            });

        } catch (error) {
            console.error("Error processing request:", error);

            // Check for invalid query parameters
            const prevQuery = aggregationPipeline ? JSON.stringify(aggregationPipeline, null, 2) : 'N/A';
            
            errorFeedback = `There was an error caused by a query you previously generated to answer this prompt: ${question}. Please generate a DIFFERENT query that answers the prompt and DOES NOT repeat the mistakes of the previous query so that it doesn't cause an error. \n\nPrevious Query: ${queryString} \n\nError Message: ${error.message}`;

            // Capture the last query along with the error message for feedback
            // console.log(`\n --- Attempt #${attempt.toString()} --- \n`.yellow.underline + errorFeedback + "\n");

            attempt++;
        }
    }

    return next(new ErrorResponse('Error processing your request', 500));
}); 

function extractDataResultFromResponse(arr) {
    let dataResult = null;

    if (Array.isArray(arr) && arr.length > 0) {
        const firstItem = arr[0];
        if (typeof firstItem === 'object') {
            for (const key in firstItem) {
                if (Object.hasOwnProperty.call(firstItem, key)) {
                    if (typeof firstItem[key] === 'number' || typeof firstItem[key] === 'string') {
                        dataResult = firstItem[key];
                        break;
                    }
                }
            }
        }
    }

    return dataResult;
}

function processQueryString(queryString) {
    // Step 1: Replace ISODate() with a placeholder
    const isoDateRegex = /ISODate\("([^"]+)"\)/g;
    let matches;
    const dates = [];

    // Collecting all ISODate strings and replacing them with placeholders
    while ((matches = isoDateRegex.exec(queryString)) !== null) {
        dates.push(new Date(matches[1]));
        queryString = queryString.replace(matches[0], `"ISODatePlaceholder${dates.length - 1}"`);
    }

    // Step 2: Parse the modified query string as JSON
    let query = JSON.parse(queryString);

    // Step 3: Replace placeholders with Date objects
    function replacePlaceholders(value) {
        if (typeof value === 'string' && value.startsWith('ISODatePlaceholder')) {
            const index = parseInt(value.replace('ISODatePlaceholder', ''), 10);
            return dates[index];
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

function extractQueryString(res) {
    const queryRegex = /"query": "\[(.*)\]",/;
    const match = res.match(queryRegex);

    if (match && match[1]) {
        // Convert the string back to JSON format
        const queryString = match[1].replace(/\\/g, "");
        
        return JSON.stringify(`[${queryString}]`);
    } else {
        console.error("Query string not found in the response");
        return null;
    }
}

function checkForSpecificParams(prompt, queryString, errMsg) {
    const parametersToCheck = [
        { parameter: "ISODate", warning: `There was an error caused by a query you generated to answer this prompt: ${prompt} \n\nThe query includes the 'ISODate' function within the query itself, which results in invalid JSON when returned by the ChatGPT API. For context, here's the query that caused the error: ${queryString} \n\nAnd here's the error message: ${errMsg} \n\nPlease convert dates into proper ISODate format BEFORE including them in the query you generate so that the query validates as JSON.` }
    ];

    for (const paramObj of parametersToCheck) {
        const regex = new RegExp(paramObj.parameter + '\\((.*?)\\)');
        if (regex.test(queryString)) {
            return paramObj.warning;
        }
    }

    return null; // Add this line to explicitly return null if no specific params are found
}

function prepareMongoQuery(queryString) {
    // Check if the query string contains 'ISODate'
    if (queryString.includes('ISODate')) {
        // Replace ISODate with a placeholder and store the date strings
        let isoDateMatches = [];
        let processedQuery = queryString.replace(/ISODate\('([^']+)'\)/g, (match, isoDate) => {
            isoDateMatches.push(isoDate);
            return '"ISODate_PLACEHOLDER"';
        });

        // Parse the JSON
        let parsedQuery;
        try {
            parsedQuery = JSON.parse(processedQuery);
        } catch (error) {
            console.error("Error parsing query string:", error);
            throw error;
        }

        // Function to recursively replace placeholders with actual Date objects
        function restoreISODate(obj) {
            for (let key in obj) {
                if (typeof obj[key] === 'string' && obj[key] === 'ISODate_PLACEHOLDER') {
                    let dateStr = isoDateMatches.shift();
                    obj[key] = new Date(dateStr);
                } else if (typeof obj[key] === 'object') {
                    restoreISODate(obj[key]);
                }
            }
        }

        // Replace the placeholders in the parsed query
        restoreISODate(parsedQuery);

        return parsedQuery;
    } else {
        // If ISODate is not found, return the original query
        return JSON.parse(queryString); // Ensure this is parsed as JSON if no ISODate is present
    }
}


