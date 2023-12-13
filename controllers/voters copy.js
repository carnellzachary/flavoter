const qs = require('qs');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Voter = require('../models/Voter');
// const chatGPTService = require('../utils/chatgptService');
const chatGPTService = require('../utils/test-chatgptService'); // Adjust the path accordingly


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
    // User prompt (Must be phrased as a question -- check for this)
    const reqQueryQuestion = "How many voters are Republicans?"

    // Ask GPT to determine if the prompt is one that requires statistical calculation of more than one variable (multiple queries) or not (one query)
    const me_whatKindOfPrompt = `I need help analyzing what I’m calling the “main question.”\n\nHere’s the main question: ${reqQueryQuestion}\n\nSpecifically, I want you to determine if answering the main question requires some kind of mathematical calculation. A mathematical calculation here means “an equation with at least two variables.”\n\nDoes answering the main question require some kind of mathematical calculation? Your response should only be "YES" or "NO”. Also, make sure there is sound logic that informs your response but don't actually include an explanation for the logic in your response.`;

    // Ask GPT to determine what variables it needs to calculate an answer to the prompt
    const me_whatVariables = `Theoretically speaking, what variables would you need to calculate an answer to the following question (Make sure your response ONLY includes a clear and thorough description of each variable, separated by a comma): ${reqQueryQuestion}\n\nAgain, to be clear, your response must not include any explanation. Your response must ONLY include a clear and thorough description of each variable, separated by a comma.`;
    
    try {
        const gpt_whatVariables = await chatGPTService.queryChatGPT(me_whatKindOfPrompt);
        res.status(200).json({
            success: true,
            question: reqQueryQuestion,
            response: gpt_whatVariables
        });
    } catch (error) {
        console.error('Error using ChatGPT:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }

});

/*
// Example of a simple extractor function
function extractQueryFromResponse(chatGPTResponse) {
    try {
      const parsedResponse = JSON.parse(chatGPTResponse);
      return parsedResponse.query || ''; // Adjust based on actual response structure
    } catch (error) {
      console.error('Error parsing ChatGPT response:', error.message);
      throw error;
    }
  }
    
// @desc    Use ChatGPT to query 
// @route   GET /api/v1/voters/askgpt
// @access  Public
exports.askGPT = asyncHandler(async (req, res, next) => {
    // Get the prompt from the request, you may adjust this based on your actual requirements
    // const prompt = req.query.prompt || "Default ChatGPT prompt";
    
    // Ask GPT to determine what data/variables it needs to calculate an answer to the prompt
    const user_whatVariables = `Theoretically speaking, what data/variables would you need to calculate an answer to following question: ${req.query.prompt}. Your response should only include each variable separated by a comma.`;
    
    // Split GPT's response by comma
    
    // Example response
    const gpt_whatVariables = 'Voter count, Count of voters with the last name Smith'
   
    const howManyVariables = gpt_whatVariables.split(',');

    try {
      // Query ChatGPT for response
      const chatGPTResponse = await chatGPTService.queryChatGPT(prompt);
  
      // Extract the generated query from ChatGPT response
      const generatedQuery = extractQueryFromResponse(chatGPTResponse);
  
      // Execute the query on your MongoDB collection
      const result = await Voter.find(generatedQuery);
  
      res.status(200).json({
        success: true,
        chatGPTResponse,
        generatedQuery,
        data: result,
      });
    } catch (error) {
      console.error('Error using ChatGPT:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
*/