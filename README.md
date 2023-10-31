# Lightbot for Mastodon
A small game rewarding patience.

*Take a deep breath and look into the lights.*

# Repo migrated to https://codeberg.org/narF/Lightbot-discord

*Lightbot* is a **Mastodon bot** that generate images for you. Like a desk plant, your image is persistent and evolves over time.

<img src="https://cdn.discordapp.com/attachments/411636274961580053/587382344667758622/light_narF_214590808727355393_1560113261308.png" alt="Example of a picture made by Lightbot" width="200"/> <img src="https://cdn.discordapp.com/attachments/418253751103651852/580947483472166919/light_Anma_230467418756087809_1558579071459.png" alt="Example of a picture made by Lightbot" width="200"/>



### Play

Lightbot's profile: https://botsin.space/@lightbot

Send a toot to the bot: `@lightbot@botsin.space`



### Alternate versions:

* For Discord: https://github.com/narFnarF/lightbot
* Original game for desktop and web browser: https://narf.itch.io/light-game



### How to install on your own machine

You can install Lightbot on your own server, computer or Raspberry Pi. It is recommended to use a machine that will stay online 24/7 but you can really install it on whatever computer you want.

- Get the repo
  - (TODO: write how!)
- `npm install` (On a Raspberry Pi, this can take 20-30 minutes and sometime look stuck for long durations. Leave it running until it's done.)
- Setup your auth key:
  - *TODO: Update this*
  - rename `auth_example.json` to `auth.json`
  - Get your bot authorization key from Discord and copy it at the appropriate place in `auth.json`
- Setup your config:
  - Rename `config_example.json` to `config.json`
  - Edit `config.json` following the instructions in the comments
