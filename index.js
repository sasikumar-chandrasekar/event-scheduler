const express = require('express');
const { google } = require('googleapis');
const { format, add } = require("date-fns");
const dotenv = require('dotenv');

const { OAuth2 } = google.auth;

const app = express();

dotenv.config();

const PORT = process.env.PORT || 3000;

const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
);

// Set the scopes for the API
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Generate a URL to authorize the user
app.get('/auth/google', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    res.redirect(authUrl);
});

// Callback route after Google authorization
app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        res.send('Authentication successful! You can now create events.');
    } catch (error) {
        res.status(500).send('Error retrieving access token');
    }
});

// Create an event
app.post('/create-event', async (req, res) => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
        summary: 'Sample Event',
        location: '800 Howard St., San Francisco, CA 94103',
        description: 'This is a sample event',
        start: {
            dateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
            timeZone: 'Asia/Kolkata'
        },
        end: {
            dateTime: format(add(new Date(), { minutes: 30 }), "yyyy-MM-dd'T'HH:mm:ssXXX"),
            ttimeZone: 'Asia/Kolkata',
        },
        attendees: [
            { email: 'clary.dev96@gmail.com' },
        ],
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 24 * 60 },
                { method: 'popup', minutes: 10 },
            ],
        },
    };

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });
        res.send(`Event created: ${response.data.htmlLink}`);
    } catch (error) {
        res.status(500).send('Error creating event');
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});