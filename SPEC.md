# Daily Smart Dashboard - Product Specification

## 1. Overview

**Project Name:** Daily Smart Dashboard  
**Type:** Web Application (SPA)  
**Core Functionality:** A personal dashboard that aggregates Gmail emails, Google Calendar events, and Microsoft Outlook/calendar data into a unified view with user authentication.  
**Target Users:** Individual users who want to view their email and calendar events from multiple providers in one place.

---

## 2. Tech Stack

### Frontend
- **Framework:** Vanilla JavaScript (single HTML file with embedded JS/CSS)
- **Styling:** CSS (embedded in HTML)
- **Deployment:** Vercel (static hosting)

### Backend
- **Runtime:** Node.js (Vercel API Routes / Serverless Functions)
- **Authentication:** Supabase Auth (email/password)
- **Database:** Supabase PostgreSQL
- **APIs:** Google Gmail API, Google Calendar API

### External Services
- **Hosting:** Vercel (https://daily-smart-dashboard.vercel.app)
- **Auth Provider:** Supabase (https://gegtjvhtqnlgtpdelupd.supabase.co)
- **OAuth:** Google Cloud Console (for Gmail/Calendar access)

---

## 3. Core Features

### F1: User Authentication
- **Description:** Users can register with email/password and log in
- **Requirements:**
  - Sign up with email + password (Supabase Auth)
  - Login with email + password
  - Logout functionality
  - Session persistence via localStorage
  - Password confirmation email on signup

### F2: Google Account Connection
- **Description:** Users can connect their Google account to access Gmail and Calendar
- **Requirements:**
  - OAuth 2.0 flow with Google
  - Store access_token and refresh_token in database
  - Support multiple connected accounts per user
  - Disconnect account functionality
  - Tokens stored as base64-encoded JSON in database

### F3: Email Display (Gmail)
- **Description:** Display recent emails from connected Google account
- **Requirements:**
  - Fetch emails from Gmail API using stored tokens
  - Display: From, Subject, Date, Snippet
  - Show up to 10 most recent emails
  - Refresh button to reload emails
  - Handle expired tokens gracefully (prompt re-auth)

### F4: Calendar Display (Google Calendar)
- **Description:** Display today's calendar events from connected Google account
- **Requirements:**
  - Fetch events from Google Calendar API
  - Display: Event title, Start time, End time
  - Show only today's events
  - Support multiple calendars (primary + additional)
  - Refresh button to reload events

### F5: Multi-Account Support
- **Description:** Users can connect multiple Google accounts
- **Requirements:**
  - Each account stored separately in database
  - User can see list of connected accounts
  - User can disconnect any account
  - Data from all connected accounts displayed

---

## 4. User Interface

### Layout
- **Header:** App title, user email display, logout button
- **Main Content:** Three-column grid on desktop, stacked on mobile
  - Column 1: Connected Accounts
  - Column 2: Calendar
  - Column 3: Emails
- **Modals:** Login/Signup modal

### Visual Design
- **Primary Color:** Purple gradient (#667eea to #764ba2)
- **Background:** Light gray (#f5f5f5)
- **Cards:** White with subtle shadow
- **Buttons:** Rounded corners, hover effects
- **Responsive:** Works on mobile and desktop

### Components
1. **Login Modal:** Email input, password input, submit button, toggle login/signup
2. **Account Card:** Provider icon, "Connected" status, disconnect button
3. **Event Card:** Time, title, calendar color
4. **Email Card:** From, subject, date, snippet preview

---

## 5. Database Schema

### Table: user_profiles
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | FK to auth.users |
| email | text | User email |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### Table: connected_accounts
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| provider | text | 'google' or 'microsoft' |
| provider_user_id | text | ID from provider |
| access_token | text | OAuth access token (base64) |
| refresh_token | text | OAuth refresh token |
| expires_at | timestamptz | Token expiration |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

**Note:** RLS is DISABLED on these tables (temporary). The API validates user identity before all operations.

---

## 6. API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Login with email/password |
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/logout | Logout user |

### Account Management
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/accounts | List connected accounts |
| POST | /api/accounts | Connect new account |
| DELETE | /api/accounts?id={id} | Disconnect account |

### Data Fetching
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/gmail/emails | Fetch Gmail messages |
| GET | /api/calendar/google | Fetch Google Calendar events |
| GET | /api/calendar/google/{calendarId} | Fetch specific calendar events |

### OAuth Flow
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/auth/google | Initiate Google OAuth |
| GET | /api/auth/google/callback | OAuth callback handler |

---

## 7. Environment Variables

Required in Vercel:
```
SUPABASE_URL=https://gegtjvhtqnlgtpdelupd.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://daily-smart-dashboard.vercel.app/auth/google/callback
```

---

## 8. Project Structure

```
DailySmartDashboard/
├── api/
│   ├── accounts/
│   │   └── index.js          # Account CRUD API
│   ├── auth/
│   │   ├── google/
│   │   │   ├── index.js     # Google OAuth initiation
│   │   │   └── callback.js  # OAuth callback
│   │   ├── login.js         # Login endpoint
│   │   ├── logout.js        # Logout endpoint
│   │   └── signup.js        # Signup endpoint
│   ├── calendar/
│   │   └── google/
│   │       └── index.js     # Google Calendar API
│   ├── gmail/
│   │   └── emails.js        # Gmail API
│   └── supabase.js          # Supabase client
├── public/
│   └── index.html           # Frontend app
├── vercel.json              # Vercel config
├── package.json             # Dependencies
└── supabase-schema.sql      # Database schema
```

---

## 9. Commands

### Development
```bash
npm install          # Install dependencies
npm run dev          # Start local server (if applicable)
```

### Deployment
- Push to GitHub main branch
- Vercel auto-deploys on push

### Testing
- Manual browser testing at https://daily-smart-dashboard.vercel.app
- Check browser console for errors

---

## 10. Testing Checklist

Before declaring a feature complete:

- [ ] User can sign up with email/password
- [ ] User can log in with email/password  
- [ ] User can log out
- [ ] User can initiate Google OAuth flow
- [ ] After OAuth, account appears in "Connected Accounts"
- [ ] Gmail emails display correctly after connecting Google
- [ ] Calendar events display correctly after connecting Google
- [ ] User can disconnect an account
- [ ] Multiple Google accounts can be connected
- [ ] Data persists after page refresh
- [ ] Data persists after logging out and back in

---

## 11. Known Issues / TODOs

- [ ] Microsoft Outlook integration not implemented
- [ ] Token refresh not implemented (tokens expire after 1 hour)
- [ ] RLS policies need fixing for proper security
- [ ] Tasks feature not implemented
- [ ] No error handling UI for API failures
- [ ] No loading states on initial load

---

## 12. Boundaries

### What the AI Should NEVER Do:
- 🚫 Commit secrets or API keys to git
- 🚫 Modify vercel.json without approval
- 🚫 Add new dependencies without approval
- 🚫 Change database schema without approval
- 🚫 Access or modify other users' data

### What the AI Should Ask First:
- ⚠️ Changes to authentication flow
- ⚠️ Database schema changes
- ⚠️ New environment variables
- ⚠️ Major UI/UX changes

### What the AI Can Do Freely:
- ✅ Fix bugs in existing code
- ✅ Add error handling
- ✅ Improve UI styling
- ✅ Add logging for debugging
- ✅ Write tests

---

## 13. Success Criteria

The app is successful when:
1. User can create account and log in
2. User can connect Google account via OAuth
3. User can see their Gmail emails in the app
4. User can see their Google Calendar events in the app
5. Data persists across sessions (logged out and back in)
6. Multiple accounts can be connected and displayed
