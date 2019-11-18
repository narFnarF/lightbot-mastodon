"use strict";

const Mastodon = require('mastodon-api');
const Masto = new Mastodon(require('./config.js'));
const striptags = require('striptags');
const fs = require('fs');
const LightPicture = require('lightbot-util').LightPicture;
const pm = require('./util/PlayerManager.js');

const listener = Masto.stream('streaming/user');





console.log("Start!");
pm.init("dbPlayers.json", "pas d'admin");
// cheat();


var interval = 15*60*1000; // 15 minutes
// var interval = 10*1000; // 10 seconds // CHEAT
setInterval(()=>{
	sendPictures();
}, interval);




listener.on('message', event => {
	console.log(`Reçu un event de stream: ${event.event}.`)
	if (event.event === 'notification') {
		console.log(`C'est un "${event.data.type}"`);
		
		if (event.data.type === 'mention') {
			// var message = cleanupMsg(msg.data.status.content, msg.data.status.mentions[0].acct);
			var cleanedMessage = extractMsgFromEvent(event);
			
			console.log(`Reçu une mention qui disait: ${cleanedMessage}`);
			saveToFileAsJSON("logs/notifMention.json", event);

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

function saveToFileAsJSON(filepath, object) {
	if (!fs.existsSync("logs/")) { //creates the logs folder if it doesn't exist
		fs.mkdirSync("logs/");
	}

	try {
		fs.writeFileSync(filepath, JSON.stringify(object, null, 4));
		console.log(`Saved file ${filepath}.`)
	} catch (error) {
		console.error(`I could not save the file to ${filepath}.`);
		console.log(error);
	}
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

async function lightCommand(args, event) {
	console.log("C'était pour un light!");
	
	const userID = event.data.account.id;
	const username = event.data.account.acct;
	const player = pm.getOrCreatePlayer(userID, username);

	if (!player.waiting) { // Not waiting, meaning it's a new request
		player.waiting = true;
		player.event = {
			data: {
				account: {
					acct: event.data.account.acct
				},
				status: {
					id: event.data.status.id
				}
			}
		};
		pm.updateLastPlayed(userID);
		// pm.increaseAttempts(userID);

		replyToot(`✅ You seek the light? Very well. The light will be coming... in a few hours. I will ping you when it is ready. Take this time to meditate on the present moment.`, event);

	} else { // Still waiting for image
		replyToot(`🕑 Be patient. Be peaceful. Beauty shall come to you. 🌱 I will ping you when it is ready.`, event);
	}

	
}

async function unknownCommand(args, event) {
	var txt = "Je n'ai pas reconnu la commande. Essaye de m'écrire 'light'.";
	console.log(txt);
	await replyToot(txt, event);
}


function sendPictures() {
	console.debug("Do I need to send pictures?");

	
	var requireSaving = false;

	pm.forEachPlayer( (id, player)=>{ // For each Player in the db
		if (player.waiting && player.waitedEnough()) { // if the player is waiting and has waited enough
			console.log("I should send a picture now!");
			console.log(id, player);
			

			var event = player.event;

			var level = player.level;
			var myFilePath = `light ${event.data.account.acct} ${event.data.account.id} ${Date.now()}.png`;
			var size = level+1;
			new LightPicture(size, myFilePath, async (err, res)=>{
				if (!err) {
					if (!res.won) { // No level up.
						await replyWithAttachment(`Here's your light show. You are level ${level}. I wonder what your next image will look like...`, event, myFilePath);

					} else { // Level up
						await replyWithAttachment(`Here's your light show. You are level ${level}. \n🎇 Enlighted! You've reached level ${level+1}. 🎇 I wonder what your next image will look like...`, event, myFilePath);
						var newLevel = pm.levelUpPlayer(id);
					}
					
					fs.rename(res.path, "previous light.png", (err2)=>{
						if ( err2 ) logger.warn(`Could not rename the screenshot ${res.path}: ${err2}`);
					});

					player.waiting = false;
					// pm.updateLastPlayed(id);
					pm.increaseAttempts(id);
					
					pm.writeDBFile();
				}
			});

			
			
			// errors?
		} else if (!player.waiting && player.event) { //I don't know what this part of the code does... :(
			player.event = undefined;
			requireSaving = true;
		}
	});

	if (requireSaving) {
		pm.writeDBFile();
	}
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
			saveToFileAsJSON("logs/postReply.json", res);
			return res;
		} else {
			console.error(err);
			throw err;
		}
	});
}

async function replyWithAttachment(text, event, filepath) {
	Masto.post('media', { file: fs.createReadStream(filepath) }).then(resp => {
		const mediaID = resp.data.id;
		const originalPostId = event.data.status.id;
		var acct = event.data.account.acct;
		Masto.post('statuses', {
			status: `@${acct} ${text}`,
			in_reply_to_id: originalPostId,
			media_ids: [mediaID]
		}, (err, res)=>{
			if (!err) {
				console.log(`${res.created_at}  Post success. Message:"${striptags(res.content)}"    Id:${res.id} `);
				saveToFileAsJSON("logs/postReply.json", res);
				return res;
			} else {
				console.error(err);
				throw err;
			}
		});
	});
}

function cheat() {
	var txtJsonEvent = fs.readFileSync("./logs/notifMention.json"); // Read a copy of the last mention received
	var event = JSON.parse(txtJsonEvent); // parse the json
	lightCommand([], event); // mimic that the command in the mention was "light"
}
