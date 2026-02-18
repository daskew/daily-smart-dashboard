// Vercel serverless-friendly Express app
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files - we'll handle this separately in vercel.json
app.use(express.static(path.join(__dirname, 'public')));

// Lazy-load auth modules to avoid initialization errors
function getGoogleAuth() {
  return require('./auth/google');
}

function getMicrosoftAuth() {
  return require('./auth/microsoft');
}

function getGmailRoutes() {
  return require('./routes/gmail');
}

function getCalendarRoutes() {
  return './routes/calendar';
}

// Auth routes
app.use('/auth/google', (req, res, next) => {
  getGoogleAuth()(req, res, next);
});

app.use('/auth/microsoft', (req, res, next) => {
  getMicrosoftAuth()(req, res, next);
});

// API routes
app.use('/api/gmail', (req, res, next) => {
  const gmailRoutes = require('./routes/gmail');
  gmailRoutes(req, res, next);
});

app.use('/api/calendar', (req, res, next) => {
  const calendarRoutes = require('./routes/calendar');
  calendarRoutes(req, res, next);
});

// Dashboard home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Vercel serverless export
module.exports = app;
