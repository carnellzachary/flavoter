// @desc    Logs request to console
const logger = (req, res, next) => {
    // req.hello = 'Hello World'; // By setting this varible on the req object, you now have access to this throughout all of your routes
    
    console.log(`${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}`);
    
    next();
};

module.exports = logger;