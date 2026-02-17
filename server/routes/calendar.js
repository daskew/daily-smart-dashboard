const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const googleAuth = require('../auth/google');
const microsoftAuth = require('../auth/microsoft');

// Token helpers (same as gmail.js)
function encodeTokens(tokens) {
  return Buffer.from(JSON.stringify(tokens)).toString('base64');
}

function decodeTokens(encoded) {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

// Google Calendar
router.get('/google', async (req, res) => {
  const encoded = req.cookies?.google_tokens;
  if (!encoded) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  const tokens = decodeTokens(encoded);
  if (!tokens) {
    return res.status(401).json({ error: 'Invalid tokens' });
  }

  try {
    const auth = googleAuth.getAuthenticatedClient(tokens);
    const calendar = google.calendar({ version: 'v3', auth });

    const now = new Date().toISOString();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now,
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 10
    });

    res.json({
      calendar: 'google',
      events: response.data.items.map(event => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        location: event.location
      }))
    });
  } catch (error) {
    console.error('Google Calendar error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Microsoft Calendar
router.get('/microsoft', async (req, res) => {
  const encoded = req.cookies?.microsoft_tokens;
  if (!encoded) {
    return res.status(401).json({ error: 'Not authenticated with Microsoft' });
  }

  const tokens = decodeTokens(encoded);
  if (!tokens) {
    return res.status(401).json({ error: 'Invalid tokens' });
  }

  try {
    const client = microsoftAuth.getAuthenticatedClient(tokens.access_token);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const response = await client.api('/me/calendar/events')
      .filter(`start/dateTime ge '${startOfDay.toISOString()}'`)
      .select('id,subject,start,end,location')
      .top(10)
      .get();

    res.json({
      calendar: 'microsoft',
      events: response.value.map(event => ({
        id: event.id,
        title: event.subject,
        start: event.start.dateTime,
        end: event.end.dateTime,
        location: event.location?.displayName
      }))
    });
  } catch (error) {
    console.error('Microsoft Calendar error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all calendars (both)
router.get('/', async (req, res) => {
  const results = { google: null, microsoft: null, errors: [] };

  // Try Google
  const googleEncoded = req.cookies?.google_tokens;
  if (googleEncoded) {
    const tokens = decodeTokens(googleEncoded);
    if (tokens) {
      try {
        const auth = googleAuth.getAuthenticatedClient(tokens);
        const calendar = google.calendar({ version: 'v3', auth });
        const now = new Date().toISOString();
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: now,
          timeMax: endOfDay.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 10
        });

        results.google = response.data.items;
      } catch (error) {
        results.errors.push({ source: 'google', error: error.message });
      }
    }
  }

  // Try Microsoft
  const msEncoded = req.cookies?.microsoft_tokens;
  if (msEncoded) {
    const tokens = decodeTokens(msEncoded);
    if (tokens) {
      try {
        const client = microsoftAuth.getAuthenticatedClient(tokens.access_token);
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const response = await client.api('/me/calendar/events')
          .filter(`start/dateTime ge '${startOfDay.toISOString()}'`)
          .select('id,subject,start,end')
          .top(10)
          .get();

        results.microsoft = response.value;
      } catch (error) {
        results.errors.push({ source: 'microsoft', error: error.message });
      }
    }
  }

  res.json(results);
});

// Get list of available Google calendars
router.get('/google/calendars', async (req, res) => {
  const encoded = req.cookies?.google_tokens;
  if (!encoded) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  const tokens = decodeTokens(encoded);
  if (!tokens) {
    return res.status(401).json({ error: 'Invalid tokens' });
  }

  try {
    const auth = googleAuth.getAuthenticatedClient(tokens);
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.calendarList.list();

    res.json({
      calendars: response.data.items.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        primary: cal.primary || false,
        backgroundColor: cal.backgroundColor
      }))
    });
  } catch (error) {
    console.error('Google Calendar List error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get events from a specific Google calendar
router.get('/google/:calendarId', async (req, res) => {
  const encoded = req.cookies?.google_tokens;
  if (!encoded) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  const tokens = decodeTokens(encoded);
  if (!tokens) {
    return res.status(401).json({ error: 'Invalid tokens' });
  }

  try {
    const auth = googleAuth.getAuthenticatedClient(tokens);
    const calendar = google.calendar({ version: 'v3', auth });
    const { calendarId } = req.params;

    const now = new Date().toISOString();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const response = await calendar.events.list({
      calendarId: decodeURIComponent(calendarId),
      timeMin: now,
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 10
    });

    res.json({
      calendarId,
      events: response.data.items
    });
  } catch (error) {
    console.error('Google Calendar error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
