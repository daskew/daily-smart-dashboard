require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const googleAuth = require('./server/auth/google');
const microsoftAuth = require('./server/auth/microsoft');
const gmailRoutes = require('./server/routes/gmail');
const calendarRoutes = require('./server/routes/calendar');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set true in production with HTTPS
}));

// Auth routes
app.use('/auth/google', googleAuth);
app.use('/auth/microsoft', microsoftAuth);

// API routes
app.use('/api/gmail', gmailRoutes);
app.use('/api/calendar', calendarRoutes);

// Dashboard home
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
  console.log(`Daily Smart Dashboard running at http://localhost:${PORT}`);
});
