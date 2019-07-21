"use strict";
// const logger = require("./logger.js");

// Class variables
var _endLevel;

class Player {
   constructor(obj) {
      /*
      2 ways:
      1) userID, username
      2) an object {name, level, lastPlayed}
      */
      // logger.debug(`argument.length: ${arguments.length}`)

      if (arguments.length == 2) { // must create an actual new Player
         var id = arguments[0];
         var name = arguments[1];
         // logger.info(`Player constructor with 2 params: ${id}, ${name}`)
         this.name = name;
         this.level = 1;
         this.lastPlayed = 0;
         this.waiting = false;
         this.attempts = 0;

      } else if (arguments.length == 1) { // receives a fake Player and transforms it into a real Player.
         // logger.debug(`Player constructor with just 1 obj param: ${obj}`);
         // console.log(obj);
         this.name = obj.name || obj.username;
         this.level = obj.level;
         this.lastPlayed = obj.lastPlayed;
         this.relight = obj.relight;
         this.waiting = obj.waiting;
         this.attempt = obj.attempts;
      }
      // logger.debug(`Created a new Player:`);
      // console.log(this);
   }

   static get endLevel() {
      if (_endLevel == undefined) {
         throw new Error(`Player.endLevel is undefined. Set it for the class like this: Player.endLevel = 20.`);
      } else {
         return _endLevel;
      }
   }
   static set endLevel(lv) {_endLevel = lv;}
   get endLevel() {return Player.endLevel;}
   set endLevel(lv) {throw new Error("Can't set endLevel in an instance of Player.");}

   setEndLevelForAllPlayers(lv) {Player.endLevel = lv; }

   increaseLevel() {
      this.level++;
   }

   increaseRelightCount() {
      if (this.relight == undefined) {
         this.relight = 1;
      } else {
         this.relight++;
      }
      this.level = 1;
   }

   allowedToPlay() {
      // Returns true if the player hasn't played in the last 5 minutes
      var canPlay = Date.now() > this.lastPlayed + (5*60*1000); //5 minutes, in ms
      return canPlay;
   }

   updateLastPlayed() {
      this.lastPlayed = Date.now();
   }

   get displayLevel() {
      if (this.relight) {
         return this.level + (this.relight * Player.endLevel);
      } else {
         return this.level;
      }

   }
}
module.exports = Player;
