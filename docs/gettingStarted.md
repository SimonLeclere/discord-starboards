# Getting started

The first step is to initialize the module.
You need to pass a Discord client as a parameter and an optional object containing the options.

```js
const Discord = require('discord.js');
const client = new Discord.Client();

// Requires Manager from discord-starboards
const StarboardsManager = require('discord-starboards');

// Initialise it
const manager = new StarboardsManager(client);

// We now have a starboardsManager property to access the manager everywhere!
client.starboardsManager = manager;
```

At this point, the module will start to manage the existing starboards. You have (almost) nothing more to do!

## Creating a starboard

To create a starboard, the module has a create() method. This method takes as parameter a Discord channel and an optional object containing the options.

```js
client.starboardsManager.create(message.channel);
```

After that, the starboard is automatically saved in the database and will continue to exist even after the bot has been restarted.

## Deleting a starboard

You can delete a starboard using the delete() method. This method takes as parameter a discord channel id and an emoji. These two elements are used to uniquely identify a starboard.

```js
client.starboardsManager.delete(message.channel.id, '⭐');
```

Warning: This method permanently removes the starboard from the database.

## Fetch starboards

To get a list of all starboards managed by the module, you can use the "starboards" property of the manager.
```js
let allStarboards = client.starboardsManager.starboards; // returns an array of starboards
```

To get all the starboards of a server, you can simply filter the starboards by `guildID`.
```js
let onServer = client.starboardsManager.starboards.filter((s) => s.guildID === message.guild.id);
```

A starboard can be uniquely identified by its channel id and emoji.
```js
let starboard = client.starboardsManager.starboards.find(s => s.channelID === message.channel.id && s.options.emoji === '⭐');
```

## Get the leaderboard of a server

The Starboard class has a leaderboard() method which allows to return an array containing the 10 most starred messages of a starboard among the last 100 of the channel. The returned messages have a new stars property which contains the number of stars in the message and an image property which contains an url if the message contains an image.

So to get the leaderboard of a starboard, you must first fetch the starboard and then use the leaderboard() method.

```js
const starboard = client.starboardsManager.starboards.find(s => s.guildID === message.guild.id && s.options.emoji === '⭐')
if(!starboard) return message.channel.send('No starboard found.');

const lb = await starboard.leaderboard();

const content = lb.map((m, i) => `**${i+1}.**     ${m.stars} ⭐  -  ${m.embeds[0].description || `[Image](${m.embeds[0].image.url})`}`);

const leaderboard = new Discord.MessageEmbed()
    .setTitle(`${message.guild.name}'s starboard`)
    .setDescription(content.join('\n'))

message.channel.send(leaderboard);
```

## Conclusion

Now that you know how to use the basics of the module, I strongly recommend that you read the following sections:
- [Events](events.md)
- [Custom database](customDatabase.md)
- [Advanced Usage](advanced.md)