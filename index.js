"use strict";

const Mastodon = require('mastodon-api');
const Masto = new Mastodon(require('./config.js'));
const striptags = require('striptags');
const fs = require('fs');
const LightPicture = require('lightbot-util');

const listener = Masto.stream('streaming/user');

listener.on('message', event => {
	console.log(`Reçu un event de stream: ${event.event}.`)
	if (event.event === 'notification') {
		console.log(`C'est un "${event.data.type}"`);
		
		if (event.data.type === 'mention') {
			// var message = cleanupMsg(msg.data.status.content, msg.data.status.mentions[0].acct);
			var cleanedMessage = extractMsgFromEvent(event);
			
			console.log(`Reçu une mention qui disait: ${cleanedMessage}`);
			saveToFile("logs/notifMention.json", event);

			// replyToot(`Time:${event.data.created_at} Salut @${event.data.account.acct}. Merci pour ton message qui disait: ${cleanedMessage}`, event);

			var commands = parseCommands(event);
			console.log(`Commands:${commands}`);

			var command = commands.shift();
			var args = commands;
			callCommand(command, args, event);
		}
	}
});

listener.on('error', (err)=>{
	console.error(err);
});

listener.on('heartbeat', (msg)=>{
	console.log('Heartbeat signal. Thump thump!');
	console.log(msg);
})

console.log("Start!");

cheat();



function extractMsgFromEvent(msg) {
	var clean = striptags(msg.data.status.content);
	var acct = msg.data.status.mentions[0].acct;
	clean = clean.replace(`@${acct} `,"");
	return clean;
}

function parseCommands(msg) {
	var clean = extractMsgFromEvent(msg);
	var commands = clean.split(" ");
	return commands;
}

function saveToFile(filepath, object) {
	fs.writeFileSync(filepath, JSON.stringify(object, null, 4));
}

function callCommand(command, args, event) {
	switch(command) {
		case "test":
			testCommand(args, event);
			break;

		case "light":
			lightCommand(args, event);
			break;

		default:
			unknownCommand(args, event);
	}
}

function testCommand(args, event) {
	console.log("c'était pour un test.");
	replyToot("Tu m'as envoyé un test!", event);
}

function lightCommand(args, event) {
	console.log("C'était pour un light!");
	

	var level = 1;
	var myFilePath = `light ${event.data.account.acct} ${event.data.account.id} ${Date.now()}.png`;
	var size = level+1;
	var pic = new LightPicture(size, myFilePath, async (err, res)=>{ 
		if (!err) {
			replyWithAttachment("hellol. this is a placeholder light show.", event, myFilePath);
			fs.rename(res.path, "previous light.png", (err)=>{
				// logger.debug(`rename`);
				if ( err ) logger.warn(`Could not rename the screenshot ${res.path}: ${err}`);
			});
		}
	});
}

function unknownCommand(args, event) {
	console.log("Je n'ai pas reconnu la commande.");
	replyToot("Je n'ai pas reconnu la commande.", event);
}

async function replyToot(text, event) {
	const acct = event.data.account.acct;
	const id = event.data.status.id;
	Masto.post('statuses', {
		status: `@${acct} ${text}`,
		in_reply_to_id: id
	}, (err, res)=>{
		if (!err) {
			console.log(`${res.created_at}  Post success. Message:"${striptags(res.content)}"    Id:${res.id} `);
			saveToFile("logs/postReply.json", res);
		} else {
			console.error(err);
		}
	});
}

async function replyWithAttachment(text, event, filepath) {
	Masto.post('media', { file: fs.createReadStream(filepath) }).then(resp => {
		const mediaID = resp.data.id;
		const id = event.data.status.id;
		var acct = event.data.account.acct;
		Masto.post('statuses', {
			status: `@${acct} ${text}`,
			in_reply_to_id: id,
			media_ids: [mediaID]
		}, (err, res)=>{
			if (!err) {
				console.log(`${res.created_at}  Post success. Message:"${striptags(res.content)}"    Id:${res.id} `);
				saveToFile("logs/postReply.json", res);
			} else {
				console.error(err);
			}
		});
	});
}

function cheat() {
	var txtJsonEvent = fs.readFileSync("./logs/notifMention.json"); // Read the file on disk
	var event = JSON.parse(txtJsonEvent);
	lightCommand([], event);
}