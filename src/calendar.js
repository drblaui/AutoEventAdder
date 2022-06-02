const {google} = require('googleapis');
require('dotenv').config();

const SCOPES = 'https://www.googleapis.com/auth/calendar';

//Important to have a valid key
const GOOGLE_PRIVATE_KEY= process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');;
const GOOGLE_CLIENT_EMAIL= process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PROJECT_NUMBER= process.env.GOOGLE_PROJECT_NUMBER;
const GOOGLE_CALENDAR_ID= process.env.GOOGLE_CALENDAR_ID;


const jwtClient = new google.auth.JWT(
	GOOGLE_CLIENT_EMAIL,
	null,
	GOOGLE_PRIVATE_KEY,
	SCOPES
);

const cal = google.calendar({
	version: 'v3',
	project: GOOGLE_PROJECT_NUMBER,
	auth: jwtClient
});


const auth = new google.auth.GoogleAuth({
    credentials: {
		private_key: GOOGLE_PRIVATE_KEY,
		client_email: GOOGLE_CLIENT_EMAIL
	},
    scopes: 'https://www.googleapis.com/auth/calendar',
});

function insert(event) {
	auth.getClient().then(a => {
		cal.events.insert({
			auth: a,
			calendarId: GOOGLE_CALENDAR_ID,
			resource: event
		}, (err, evt) => {
			if (err) {
				console.log('There was an error contacting the Calendar service: ' + err);
				return;
			}
			console.log('Event created: %s', evt.data);
		});
	});
}

module.exports = {insert};