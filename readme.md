# Discord Starboards

Discord Starboards is a powerful [Node.js](https://nodejs.org) module that allows you to easily create Starboards !

## Features

-   ⏱️ Easy to use! Create and delete your starboards and the module takes care of the rest!
-   🔄 Automatic restart after bot crash!
-   📁 Support for all databases! (default is json)
-   ⚙️ Very customizable! (emoji, threshold, selfstat, botStars, etc...)
-   💥 Events: starboardCreate, starboardDelete, starboardReactionAdd, starboardReactionRemove, starboardReactionRemoveAll


## Installation

```js
npm install discord-starboards
```

## Examples

### Launch of the module

```js
const Discord = require('discord.js');
const client = new Discord.Client();

// Requires Manager from discord-starboards
const StarboardsManager = require('discord-starboards');

// Initialise it
const manager = new starboardsManager(client);

// We now have a starboardsManager property to access the manager everywhere!
client.starboardsManager = manager;

client.on('ready', () => {
    console.log("I'm ready !");
});

client.login('SUP3R_S3CR3T_T0K3N');
```

Parameters: 
-   **client**: the discord client (your discord bot instance)
-   **options.storage**: A file path to choose where to store the starboards (or false if you use your own database)

After that, the module will automatically retrieve already existing starboards and start waiting for reactions.

### Create a starboard

```js
client.on('message', (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === 'create-starboard') {
        client.starboardsManager.create(message.channel);
        message.channel.send(`The ${message.channel} channel is now a starboard!`);
    }
});
```

-   **options.emoji**: The emoji to react with in order to get the message into the starboard
-   **options.starBotMsg**: Whether or not the messages from bots can be starred
-   **options.selfStar**: Whether users can star their own messages or not
-   **options.attachments**: Whether images can be starred or not
-   **options.threshold**: The number of reactions it takes before a message enters the starboard


### Fetch starboards

```js
// The list of all the starboards
let allStarboards = client.starboardsManager.starboards; // returns an array of starboards

// The list of all the starboards on the server with ID "1909282092"
let onServer = client.starboardsManager.starboards.filter((s) => s.guildID === '1909282092');
```

### Delete a starboard

```js
client.on('message', (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === 'delete') {
        manager.delete(message.channel);
        message.channel.send(`The ${message.channel} channel is no longer a starboard!`);
    }
});
```

When you use the delete function, the starboard data is deleted from the database.

## Custom database

You can use your custom database to save starboards, instead of the json files (the "database" by default for discord-starboards). For this, you will need to extend the `starboardsManager` class, and replace some methods with your custom ones. There are 4 methods you will need to replace:

-   `getAllStarboards`: this method returns an array of stored starboards.
-   `saveStarboard`: this method stores a new starboard in the database.
-   `deleteStarboard`: this method deletes a starboard already stored in the database.

**All the methods should be asynchronous to return a promise.**

Here is an example, using quick.db, a Sqlite database. The comments in the code below are very important to understand how it works!

```js
const Discord = require('discord.js');
const client = new Discord.Client();

// Load quick.db - it's an example of custom database, you can use MySQL, PostgreSQL, etc...
const db = require('quick.db');
if (!db.get('starboards')) db.set('starboards', []);

const { starboardsManager } = require('discord-starboards');
const starboardsManagerCustomDb = class extends starboardsManager {
    // This function is called when the manager needs to get all the starboards stored in the database.
    async getAllStarboards() {
        // Get all the starboards in the database
        return db.get('starboards');
    }

    // This function is called when a starboard needs to be saved in the database (when a starboard is created or when a starboard is edited).
    async saveStarboard(data) {
        // Add the new one
        db.push('starboards', data);
        // Don't forget to return something!
        return true;
    }


    // This function is called when a starboard needs to be deleted from the database.
    async deleteStarboard(channelID) {
        // Remove the starboard from the array
        const newStarboardsArray = db.get('starboards').filter((starboard) => starboard.channelID !== channelID);
        // Save the updated array
        db.set('starboards', newStarboardsArray);
        // Don't forget to return something!
        return true;
    }
};

// Create a new instance of your new class
const manager = new starboardsManagerCustomDb(client, {
    storage: false, // Important - use false instead of a storage path
});
// We now have a starboardsManager property to access the manager everywhere!
client.starboardsManager = manager;

client.on('ready', () => {
    console.log("I'm ready !");
});

client.login('SUP3R_S3CR3T_T0K3N');
```