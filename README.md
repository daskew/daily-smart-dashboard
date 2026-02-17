# Daily Smart Dashboard

A personal dashboard that aggregates your calendars, emails, and tasks from Gmail and Outlook (Microsoft Graph) in one place.

![Dashboard Preview](https://via.placeholder.com/800x400?text=Daily+Smart+Dashboard)

## Features

- 📅 **Calendar Integration** - View today's events from Google Calendar and Outlook
- 📧 **Email Preview** - See recent emails from Gmail
- ✅ **Tasks** - Coming soon!
- 🔐 **Secure OAuth2** - Your credentials are never stored

## Prerequisites

- Node.js 18+
- Google Account (for Gmail + Google Calendar)
- Microsoft Account (for Outlook + Outlook Calendar)
- Google Cloud Project (free)
- Azure App Registration (free)

## Quick Setup

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/daily-smart-dashboard.git
cd daily-smart-dashboard
npm install
```

### 2. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Gmail API** and **Google Calendar API**
4. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Set application type to **Web application**
6. Add `http://localhost:3000` as authorized redirect URI
7. Copy your **Client ID** and **Client Secret**

### 3. Configure Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com/)
2. Search "App registrations" → New registration
3. Name: "Daily Smart Dashboard"
4. Redirect URI: `http://localhost:3000/api/microsoft/callback` (Web)
5. After creating, go to **Certificates & secrets** → New client secret
6. Go to **API permissions** → Add permission → Microsoft Graph → **Mail.Read**, **Calendars.Read**, **User.Read**
7. Copy **Application (client) ID** and **Secret**

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 5. Run

```bash
npm start
```

Open http://localhost:3000 in your browser.

## Project Structure

```
daily-smart-dashboard/
├── public/
│   └── index.html       # Dashboard frontend
├── server/
│   ├── index.js         # Express server
│   ├── auth/
│   │   ├── google.js    # Google OAuth2
│   │   └── microsoft.js # Microsoft OAuth2
│   └── routes/
│       ├── gmail.js    # Gmail API routes
│       └── calendar.js # Calendar API routes
├── package.json
├── .env.example
└── README.md
```

## API Reference

| Endpoint | Description |
|----------|-------------|
| `GET /api/gmail/login` | Initiate Google OAuth |
| `GET /api/gmail/callback` | OAuth callback |
| `GET /api/gmail/emails` | Get recent emails |
| `GET /api/calendar` | Get all calendar events |
| `GET /api/calendar/google` | Get Google Calendar events |
| `GET /api/calendar/microsoft` | Get Outlook events |

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use HTTPS
3. Set a strong `SESSION_SECRET`
4. Use a session store (Redis, MongoDB, etc.)
5. Encrypt tokens before storing
6. Update redirect URIs to your production domain

### Example with Railway/Render/Replit

Add your environment variables in the hosting platform's dashboard.

## Troubleshooting

**"Invalid client" error:**
- Check your Client ID is correct
- Make sure redirect URI matches exactly

**"Access denied" error:**
- Go to Azure → Your App → API permissions
- Click "Grant admin consent" if needed

**Can't see emails:**
- Make sure you're using a Gmail account (not G Suite managed)
- Check that Gmail API is enabled in Google Cloud Console

## License

MIT License - feel free to use and modify!
