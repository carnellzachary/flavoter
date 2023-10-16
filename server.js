const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const fileupload = require('express-fileupload');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');
// const logger = require('./middleware/logger');

// Load env vars found in the config file (before connecting to database)
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// Route files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
// const { connect } = require('mongoose');

// Intialize app with Express
const app = express();

// Body parser
app.use(express.json());

// Mount logger
// app.use(logger);

// Dev logging middleware (for development only)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Different parameters will log different things
}

// File uploading middleware
app.use(fileupload());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);

// Error handiling middleware (has to be executed after bootcamps controller methods)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold));

// Handle unhandled promise rejections (So server doesn't start if db doesn't connect)
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red);

    // Close server & exit process
    server.close(() => process.exit(1));
});
