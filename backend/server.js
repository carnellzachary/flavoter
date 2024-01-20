const path = require('path');
const cors = require('cors');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

// Load env vars found in the config file (before connecting to database)
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// Route files (actual data)
const voters = require('./routes/voters');
const votes = require('./routes/votes');
const auth = require('./routes/auth');
const users = require('./routes/users');


// Intialize app with Express
const app = express();

// Body parser
app.use(express.json());

// Restrict CORS to React APP
app.use(cors({ origin: 'http://localhost:3000' }));

// Cookie parser
app.use(cookieParser());

// Mount logger
// app.use(logger);

// Dev logging middleware (for development only)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Different parameters will log different things
}

// File uploading middleware
app.use(fileupload());

// Sanitize data
app.use(mongoSanitize());

// Set security headers
// app.use(helmet());

// Temporary for development
// Set security headers, including CSP with 'unsafe-inline' for scripts
app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          // Add other directives as needed
        },
      },
    })
  );

// Prevent cross-site scripting attacks
app.use(xss());

// Rate limiting (Max 100 requests every 10 mins)
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100
});

app.use(limiter);

// Prevent HTTP param pollution
app.use(hpp());

// Set static folder
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Mount routers (actual data)
app.use('/api/v1/voters', voters);
app.use('/api/v1/votes', votes);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);


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
