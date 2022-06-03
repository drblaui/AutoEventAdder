const Imap = require('node-imap');
const fs = require('fs');
const {
	Base64Decode
} = require('base64-stream');
require('dotenv').config();

let imap = new Imap({
	user: process.env.MAIL_SERVICE_USER,
	password: process.env.MAIL_SERVICE_PASS,
	host: process.env.MAIL_SERVICE_HOST,
	port: parseInt(process.env.MAIL_SERVICE_PORT),
	tls: process.env.MAIL_SERVICE_SECURE === "true"
});

function findAttachmentParts(struct, attachments) {
	attachments = attachments || [];
	for (var i = 0, len = struct.length, r; i < len; ++i) {
		if (Array.isArray(struct[i])) {
			findAttachmentParts(struct[i], attachments);
		} else {
			if (struct[i].disposition && ['INLINE', 'ATTACHMENT'].indexOf(toUpper(struct[i].disposition.type)) > -1) {
				attachments.push(struct[i]);
			}
		}
	}
	return attachments;
}

function toUpper(thing) {
	return thing && thing.toUpperCase ? thing.toUpperCase() : thing
};

function buildAttMessageFunction(attachment) {
	var filename = attachment.params.name;
	var encoding = attachment.encoding;

	return function (msg, seqno) {
		var prefix = '(#' + seqno + ') ';
		msg.on('body', function (stream, info) {
			filename = './events/' + filename.replace('.ics', `${seqno}.ics`);
			//Create a write stream so that we can stream the attachment to file;
			console.log(prefix + 'Streaming this attachment to file', filename, info);
			var writeStream = fs.createWriteStream(filename);
			writeStream.on('finish', function () {
				console.log(prefix + 'Done writing to file %s', filename);
			});

			//stream.pipe(writeStream); this would write base64 data to the file.
			//so we decode during streaming using 
			if (toUpper(encoding) === 'BASE64') {
				//the stream is base64 encoded, so here the stream is decode on the fly and piped to the write stream (file)
				stream.pipe(new Base64Decode()).pipe(writeStream);
			} else {
				//here we have none or some other decoding streamed directly to the file which renders it useless probably
				stream.pipe(writeStream);
			}
		});
		msg.once('end', function () {
			console.log(prefix + 'Finished attachment %s', filename);
		});
	};
}

//function getAttachments(callback) {

	imap.once('ready', () => {
		imap.status('Wohnung', (err, status) => {
			if (err) {
				console.log("Err while getting folder");
				throw err;
			}
			if (status.messages.unseen === 0) {
				console.log("Nothing new");
				imap.end();
			}
		});
		imap.openBox('Wohnung', true, (err, box) => {
			if (err) throw err;
			imap.search(['UNSEEN'], (err, res) => {
				if (err) throw err;
				let f = imap.fetch(res, {
					bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
					struct: true
				});

				f.on('message', (msg, _seqno) => {
					msg.once('attributes', (attrs) => {
						let attachments = findAttachmentParts(attrs.struct);
						if (attachments.length <= 0) return;
						for (let i = 0; i < attachments.length; i++) {
							let attachment = attachments[i];
							if (attachment.params.name != 'termin.ics') return;
							let f = imap.fetch(attrs.uid, {
								bodies: [attachment.partID],
								struct: true
							});
							f.on('message', buildAttMessageFunction(attachment))
							imap.addFlags(attrs.uid, ['\\Seen'], (err) =>{
								if (err) {
									console.log("Err while marking as seen");
									throw err;
								}
							});
						}
					})
				})
				f.once('end', () => {
					imap.end();
					//callback();
				});
			});
		})
	});

	imap.connect();
//}

/*module.exports = {
	getAttachments
};*/