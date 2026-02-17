require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const googleAuth = require('./auth/google');
const microsoftAuth = require('./auth/microsoft');
const gmailRoutes = require('./routes/gmail');
const calendarRoutes = require('./routes/calendar');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// Auth routes
app.use('/auth/google', googleAuth);
app.use('/auth/microsoft', microsoftAuth);

// API routes
app.use('/api/gmail', gmailRoutes);
app.use('/api/calendar', calendarRoutes);

// Dashboard home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Vercel serverless export
module.exports = app;
