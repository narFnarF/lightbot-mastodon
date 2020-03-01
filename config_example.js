module.exports = {
  access_token: "", //Put your own Mastodon access token here.

  api_url: "https://example.com/api/v1/", //Put the domain where your bot lives here

  sendPicturesFrequency: 15*60*1000, //Frequency at which the bot will check if it should send pictures, in milliseconds

  waitTime: {
    minimum: 3*60*60*1000,
    maximum: 3*60*60*1000, //not used for now
  },

  rateLimiter: {
    extraTimePerRequest: 20, // Each superfluous request will have to wait this duration longer each time. (In seconds)
    ignoreRequestsThreshold: 50, // Once the duration hits this threashold, the request is simply ignored. (In seconds)
  },

  cheats: {
    cacheCalls: true, //If true, will save the last replies from the Mastodon API in the logs folder.
    useCachedMention: true, //Use the last mention from the debug cache
  },
};
