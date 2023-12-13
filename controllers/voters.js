const axios = require('axios');
const OpenAI = require("openai");
const qs = require('qs');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const QueryBuilder = require('../utils/queryBuilder');
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

// @desc    Use ChatGPT to query 
// @route   GET /api/v1/voters/askgpt
// @access  Public
exports.askGPT = asyncHandler(async (req, res, next) => {
    // Hard-coded this question for testing
    const question = "How many voters have an inactive voter status?";

    try {
        const response = await QueryBuilder.handle(question);
        console.log("Response:", response);
    
        const queryResponse = JSON.parse(response);
        const aggregationQuery = queryResponse.query;
    
        console.log("Aggregation pipeline:", aggregationQuery);
    
        const result = await Voter.aggregate(JSON.parse(aggregationQuery)); // Use the JSON string directly
    
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error processing request:", error);
        return next(new ErrorResponse('Error processing your request', 500));
    }    
});











/*
// @desc    Use ChatGPT to query 
// @route   GET /api/v1/voters/askgpt
// @access  Public
exports.askGPT = asyncHandler(async (req, res, next) => {
    // Hard-coded this question for testing
    const question = "What percentage of voters who live in Gainesville are registered with the Republican party?";

    try {
        const gptResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0613",
            messages: [
                {
                    role: 'system',
                    content: `You are an expert in constructing MongoDB queries. Here is an example document from my MonogDB collection of voter data (Each document represents an individual voter): {"profile":{"suffix":null,"firstName":"Eugene","middleName":null,"lastName":"Miles","dob":"2049-01-25T05:00:00.000Z","gender":"M","race":3},"address":{"addr1":"1002 Oxford Cir","addr2":null,"city":"Gainesville","state":null,"zip":"326075748","mailAddr1":"7257 NW 4Th Blvd #273","mailAddr2":null,"mailAddr3":null,"mailCity":"Gainesville","mailState":"FL","mailZip":"32607","mailCountry":null},"contact":{"phoneArea":null,"phoneNumber":null,"phoneExtension":null,"email":null},"district":{"countyCode":"ALA","congressionalDistrict":"3","houseDistrict":"21","senateDistrict":"9","schoolBoardDistrict":"5","precinct":"52","precinctGroup":"0","precinctSplit":"52.4","precinctSuffix":null},"geoloc":{"matching":"Match","exactness":"Non_Exact","outputAddress":"1002 OXFORD CT, GAINESVILLE, FL, 32607","tigerId":"6820086","tigerIdSide":"R","countyCode":"1","tractCode":"2218","blockCode":"1019","streetInput":"1002 Oxford Cir","cityInput":"Gainesville","zipInput":"326075748","type":"Point","coordinates":[-82.413749156,29.644428071]},"_id":"65761c9d4a1d1e81cab4decf","party":"DEM","exempt":"N","votes":[{"_id":"653dc9de7e849fdc88d6a59e","countyCode":"ALA","electionDate":"2020-11-03","electionType":"GEN","historyCode":"A"},{"_id":"653dca377e849fdc88da9b79","countyCode":"ALA","electionDate":"2008-11-04","electionType":"GEN","historyCode":"Y"}],"voterStatus":"ACT","voter_id":"100450405”}\n\nBased on your analysis of my document schema, I want you to carefully intrepret and logically translate natural language questions, like "What percent of voters who live in Gainesville are registered with the Republican party?" or "How many voters in Alachua County were born in the year 2000?", into a Mongoose query that uses the aggregate() method on my “Voter” model (Please do not use any other method). Your responses must contain ONLY the code, minified to one line with no formatting, and nothing else: No explanation or headers. Just the code.`
                },
                {
                    role: 'user',
                    content: question
                }
            ],
            temperature: 0.2
        });

       // const result = eval("await " + gptResponse.choices[0].message.content);
         
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error processing request:", error);
        return next(new ErrorResponse('Error processing your request', 500));
    }
});


exports.askGPT = asyncHandler(async (req, res, next) => {
    const question = "What percentage of voters who live in Gainesville are registered with the Republican party?";

    try {
        const gptResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: 'user', content: `Adopt the persona of a computer programming expert. Below is an example document from my MonogDB collection of voter data. Each document represents an individual voter:\n{"profile":{"suffix":null,"firstName":"Eugene","middleName":null,"lastName":"Miles","dob":"2049-01-25T05:00:00.000Z","gender":"M","race":3},"address":{"addr1":"1002 Oxford Cir","addr2":null,"city":"Gainesville","state":null,"zip":"326075748","mailAddr1":"7257 NW 4Th Blvd #273","mailAddr2":null,"mailAddr3":null,"mailCity":"Gainesville","mailState":"FL","mailZip":"32607","mailCountry":null},"contact":{"phoneArea":null,"phoneNumber":null,"phoneExtension":null,"email":null},"district":{"countyCode":"ALA","congressionalDistrict":"3","houseDistrict":"21","senateDistrict":"9","schoolBoardDistrict":"5","precinct":"52","precinctGroup":"0","precinctSplit":"52.4","precinctSuffix":null},"geoloc":{"matching":"Match","exactness":"Non_Exact","outputAddress":"1002 OXFORD CT, GAINESVILLE, FL, 32607","tigerId":"6820086","tigerIdSide":"R","countyCode":"1","tractCode":"2218","blockCode":"1019","streetInput":"1002 Oxford Cir","cityInput":"Gainesville","zipInput":"326075748","type":"Point","coordinates":[-82.413749156,29.644428071]},"_id":"65761c9d4a1d1e81cab4decf","party":"DEM","exempt":"N","votes":[{"_id":"653dc9de7e849fdc88d6a59e","countyCode":"ALA","electionDate":"2020-11-03","electionType":"GEN","historyCode":"A"},{"_id":"653dca377e849fdc88da9b79","countyCode":"ALA","electionDate":"2008-11-04","electionType":"GEN","historyCode":"Y"}],"voterStatus":"ACT","voter_id":"100450405”}\n\nBased on your analysis of my document schema, I want you to carefully intrepret and logically translate the following natural language question into a Mongoose query that uses the aggregate() method on my “Voter” model (Please do not use any other method): ${question}\n\nYour response must contain ONLY the code, minified to one line with no formatting, and nothing else: No explanation or headers. Just the code. It also cruical that your code NEVER includes double quote marks. Your code must ONLY include single quote marks.` }],
            temperature: 0.2
        });

        // Log the entire response for inspection
        // console.log("GPT Response:", JSON.stringify(gptResponse, null, 2));

       // const queryString = gptResponse.choices[0].message.content;

       // Define the code as a string
       const codeString = `
       (async () => {
         const result = await Voter.countDocuments({"address.city": "Gainesville", "party": "REP"}) / await Voter.countDocuments({"address.city": "Gainesville"}) * 100;
         return result;
       })();
     `;

     // Create a function using the Function constructor
     const myFunction = new Function('Voter', codeString);

     // Assuming you have a Voter object or collection, you can call the function
     const result = await myFunction(Voter);

     res.status(200).json({
         success: true,
         data: result
     });
 } catch (error) {
     console.error("Error processing request:", error);
     return next(new ErrorResponse('Error processing your request', 500));
 }
});
*/