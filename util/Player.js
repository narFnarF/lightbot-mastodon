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
         this.waiting = false; // TODO: Add a value to store the time
         this.attempts = 0;
         this.event = undefined;

      } else if (arguments.length == 1) { // receives a fake Player and transforms it into a real Player.
         // logger.debug(`Player constructor with just 1 obj param: ${obj}`);
         // console.log(obj);
         this.name = obj.name || obj.username;
         this.level = obj.level;
         this.lastPlayed = obj.lastPlayed;
         this.relight = obj.relight;
         this.waiting = obj.waiting;
         this.attempts = obj.attempts;
         this.event = obj.event;
         this.delay = obj.delay;
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

   setEndLevelForAllPlayers(lv) {Player.endLevel = lv; } // TODO : Is this used??

   
   increaseAttempts() {
      if (!this.attempts) {
         this.attempts = 0;
      }
      this.attempts++;
      return this.attempts;
   }
   
   increaseLevel() {
      this.level++;
      return this.level;
   }

   increaseRelightCount() {
      if (this.relight == undefined) {
         this.relight = 1;
      } else {
         this.relight++;
      }
      this.level = 1;

      return { level: this.level,   relight: this.relight };
   }

   waitedEnough() {
      // Returns true if the player hasn't played recently
      
      // var delay = 3*60*60*1000; // 3 hours
      var delay = 30*1000; // 30 seconds // CHEAT
      var canPlay = Date.now() > this.lastPlayed + delay;
      return canPlay;
   }

   // readyToSendPicture() {
   //    // Returns true if the player has waited long enough and we can send his picture
   //    var canSend = Date.now() > this.lastPlayed + ;
   //    return canSend;
   // }

   updateLastPlayed() {
      this.lastPlayed = Date.now();
      return this.lastPlayed;
   }

   get displayLevel() {
      if (this.relight) {
         return this.level + (this.relight * Player.endLevel);
      } else {
         return this.level;
      }
   }

   increaseDelay() {
      if (this.delay) {
         this.delay += 10;
         console.debug(`this.delay existed and now has a value of ${this.delay}`);
      } else {
         this.delay = 2;
         console.debug(`this.delay didn't exist and now has a value of ${this.delay}`);
      }
   }

   async waitAndSetRateLimit() {
      this.increaseDelay();
      if (this.delay < 100) {
         var sleepDuration = Math.max(this.delay-10, 0) * 1000;
         await sleep(sleepDuration);
      } else {
         throw new Error("Rate-limited");
      }
   }

   clearRateLimit() {
      this.delay = undefined;
   }
}
module.exports = Player;

async function sleep(ms) {
   console.debug(`sleeping for ${ms}ms or ${ms/1000}seconds.`);
   return new Promise(resolve => setTimeout(resolve, ms));
}

