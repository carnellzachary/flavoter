const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const logger = require('./middleware/logger');

// Route files
const bootcamps = require('./routes/bootcamps');

// Load env vars found in the config file
dotenv.config({ path: './config/config.env' });

// Intialize app with Express
const app = express();

// Mount logger
app.use(logger);

// Dev logging middleware (for development only)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Different parameters will log different things
}

// Mount routers
app.use('/api/v1/bootcamps', bootcamps);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));