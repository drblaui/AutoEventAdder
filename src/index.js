const calendar = require("./calendar");
const fs = require('fs');
const ical = require('node-ical');

let files = fs.readdirSync('./events');
files.forEach(file => {
	if (file === '.gitkeep') return;
	const data = fs.readFileSync(`./events/${file}`, 'utf-8');
	let event = ical.sync.parseICS(data);
	Object.keys(event).forEach(key => {
		if(key === 'vcalendar') return;
		let currEvent = event[key];
		let eventObj = {
			summary: currEvent.summary.val,
			location: currEvent.location,
			description: '',
			start: {
				dateTime: currEvent.start.toISOString(),
				timeZone: currEvent.start.tz
			},
			end: {
				dateTime: currEvent.end.toISOString(),
				timeZone: currEvent.end.tz
			}
		}
		calendar.insert(eventObj);
	});
});
//calendar.insert(testEvent);