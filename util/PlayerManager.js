"use strict";

// Dependencies
const fs = require("fs");
const Player = require('./Player.js');
// const logger = require("./logger.js");
const {promisify} = require('util');
// const config = require("./config.json");
// const appRoot = require('app-root-path').toString()
// const pathModule = require('path')

const writeFilePromisified = promisify(fs.writeFile);

class PlayerManager {
	constructor() {
		this.initialized = false;
		this.adminID; // TODO: Remove all adminID stuff. It's not used by Lightbot since the switch to Discord.js
		this.pathToDB;
		
		this.currentlyWriting = false;
		// this.writeQueue = [];
		this.needToWriteAgain = false;

		// this.writeDBFile();

		this.endLevel = 20 // Careful changing this: it'll probably break the color tint. The tint formula would need to be adjusted.
		Player.endLevel = this.endLevel;
	}

	init(pathToDB, adminID) {
		if (!pathToDB) {
			throw new Error(`The pathToDB is missing. It was set to ${pathToDB}.`);
		}
		if (!adminID) { // TODO: Remove all adminID stuff
			throw new Error(`Missing adminID. It was set to ${adminID}.`);
		}
		this.initialized = true;
		this.adminID = adminID;
		this.pathToDB = pathToDB;
		this.players = this.readDBFile(pathToDB);
	}

	// get pathToDB() {
	//	 return this.pathToDB;
	// }

	readDBFile(path) {
		var content;
		if (fs.existsSync(path)) {
			var txt = fs.readFileSync(path); // Read the file on disk

			// Read the JSON in the file
			try {
				content = JSON.parse(txt);
			} catch (err) {
				console.error(`The content of the JSON database at "${path}" is not formatted properly. Try to fix the JSON inside.`);
				throw err;
			}

		} else {
			content = {};
		}

		// Convert the old DB style into the new one
		if (content.hasOwnProperty("players")) {
			content = content.players;
		}

		// convert untyped objects in Content into a Player type
		for (var key in content) {
			content[key] = new Player(content[key]);
		}
		return content;
	}

	async writeDBFile() {
		//write the db in file

		console.debug("Requested to save.");
		this.checkIfInitialized();

		if (!this.currentlyWriting) { // It is unsafe to use fs.writeFile() multiple times on the same file without waiting for the callback. https://nodejs.org/api/fs.html#fs_fs_writefile_file_data_options_callback
			this.currentlyWriting = true;

			// Prepare the json string to write
			var beautifulPlayersDB = JSON.stringify(this.players, null, 4);
			if (!beautifulPlayersDB) { // if the json string is empty for some reason
				console.debug(`I'm about to write but beautifulPlayersDB is empty. Here's the object:`);
				console.log(this.players);
				throw new Error(`beautifulPlayersDB is empty!`);
			}

			// write the json file
			try {
				// console.debug(`starting to write...`)
				await writeFilePromisified(this.pathToDB, beautifulPlayersDB, 'utf8')
				this.currentlyWriting = false;
				console.debug(`Saved the DB to "${this.pathToDB}"`);
				// If there are more requests to save, we do them!
				if (this.needToWriteAgain) {
					this.needToWriteAgain = false;
					// console.debug(`needToWriteAgain`);
					this.writeDBFile();
				}

			} catch (e) {
				console.warn(`Could not write "${this.pathToDB}" on disk.`);
				console.warn(e);
			}
		} else {
			console.debug(`Trying to write to "${this.pathToDB}", but i'm actually already writing! Will try again when it's done.`);
			// this.writeQueue.push(callback);
			this.needToWriteAgain = true;
		}
	}

	createPlayer(userID, name) {
		this.checkIfInitialized();

		if (this.exists(userID)) { // If it already exists
			console.warn(`Trying to create a player that already exists: ${name} (${userID})`)
			return this.players[userID];
		} else {
			var player = new Player(userID, name);
			this.players[userID] = player;
			
			return player;
		}
	}

	exists(userID) { // return true if the player exists in the DB

		this.checkIfInitialized();

		if (this.players[userID] == null) {
			return false;
		} else {
			return true;
		}
	}

	getPlayer(userID) {
		// Returns the player with this userID
		// Returns undefined if the player doesn't exist

		this.checkIfInitialized();

		// console.info(`Getting player ${userID}`)
		if (this.exists(userID)) {
			if (this.players[userID] instanceof Player) {
				return this.players[userID];
			} else {
				console.warn(`Found a fake object! (It's not actually a member of class Player):`);
				console.warn(this.players[userID]);
				return undefined;
			}
			// console.info(`Found it. Is it a member of Player? ${this.players[userID] instanceof Player}`)
		} else {
			return undefined;
		}
	}

	getOrCreatePlayer(userID, username) {
		if (this.exists(userID)) {
			return this.getPlayer(userID);
		} else {
			return this.createPlayer(userID, username);
		}
	}

	forEachPlayer(callback) {
		if (callback) {
			Object.keys(this.players).forEach((id)=>{ // for each object in the player db
				var player = this.players[id];
				callback(id, player);
			})
		}
	}

	isAdmin(userID) {
		// Returns true if the id is the same as the admin's id.
		// usage: pm.isAdmin("1234567890")

		this.checkIfInitialized();

		var res = (userID == this.adminID);
		// console.debug(`Checking if ${userID} is an admin. The admin is ${this.adminID} so it is ${res}.`)
		return res;
	}

	async levelUpPlayer(id) {
		this.checkIfInitialized();

		var level = this.getPlayer(id).increaseLevel(); // do the level up
		await this.writeDBFile();
		return level;
	}

	async increaseAttempts(userID) { // TODO: Looks like this is not working as intended. Maybe fix this later?
		this.checkIfInitialized();

		var attempts = this.getPlayer(userID).increaseAttempts();
		await this.writeDBFile();
		return attempts;
	}

	async relight(id) {
		this.checkIfInitialized();

		var data = this.getPlayer(id).increaseRelightCount();
		await this.writeDBFile();
		return data; //format: { level: this.level,   relight: this.relight };
	}

	async updateLastPlayed(id) {
		this.checkIfInitialized();

		var lastPlayed = this.getPlayer(id).updateLastPlayed();
		await this.writeDBFile();
		return lastPlayed;
	}

	async exit() {
		this.checkIfInitialized();

		console.debug(`PlayerManager was asked to exit. Saving the DB to disk...`)
		await this.writeDBFile();
		console.debug(`The DB is saved. PlayerManager will now exit.`)
	}

	checkIfInitialized() {
		if (!this.initialized) {
			const newErr = new Error("This PlayerManager was not initialized. You need to initialize it first by doing: playerManager.init(\"PATH/TO/DB\", \"YOUR_ADMIN_ID\");");
			newErr.name = "PLAYER_MANAGER_NOT_INIT";
			throw newErr;
		}
	}
}

module.exports = new PlayerManager();
