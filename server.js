const express = require('express');
const dotenv = require('dotenv');

// Load env vars found in the config file
dotenv.config({ path: './config/config.env' });

// Intialize app with Express
const app = express();

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));