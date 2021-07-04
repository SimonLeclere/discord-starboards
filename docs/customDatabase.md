# Custom database

You can use your custom database to save starboards, instead of the json files (the "database" by default for discord-starboards). For this, you will need to extend the `StarboardsManager` class, and replace some methods with your custom ones. There are 4 methods you will need to replace:

- `getAllStarboards`: this method returns an array of stored starboards.
- `saveStarboard`: this method stores a new starboard in the database.
- `deleteStarboard`: this method deletes a starboard already stored in the database.
- `editStarboard`: This method edits a starboard already saved in the database.

Don't forget to set the manager's `storage` option to false !

**All the methods should be asynchronous to return a promise.**

Here is an example, using quick.db, a Sqlite database. The comments in the code below are very important to understand how it works!

```js
const Discord = require("discord.js");
const client = new Discord.Client();

// Load quick.db - it's an example of custom database, you can use MySQL, PostgreSQL, etc...
const db = require("quick.db");
if (!db.get("starboards")) db.set("starboards", []);

const StarboardsManager = require("discord-starboards");
const StarboardsManagerCustomDb = class extends StarboardsManager {
  // This function is called when the manager needs to get all the starboards stored in the database.
  async getAllStarboards() {
    // Get all the starboards in the database
    return db.get("starboards");
  }

  // This function is called when a starboard needs to be saved in the database (when a starboard is created or when a starboard is edited).
  async saveStarboard(data) {
    // Add the new one
    db.push("starboards", data);
    // Don't forget to return something!
    return true;
  }

  // This function is called when a starboard needs to be deleted from the database.
  async deleteStarboard(channelId, emoji) {
    // Remove the starboard from the array
    const newStarboardsArray = db
      .get("starboards")
      .filter(
        (starboard) => !(starboard.channelId === channelId && starboard.options.emoji === emoji),
      );
    // Save the updated array
    db.set("starboards", newStarboardsArray);
    // Don't forget to return something!
    return true;
  }

  // This function is called when a starboard needs to be edited in the database
  async editStarboard(channelId, emoji, data) {
    // Gets all the current starboards
    const starboards = db.get("starboards");
    // Remove the old starboard from the db
    const newStarboardsArray = starboards.filter(
      (starboard) => !(starboard.channelId === channelId && starboard.options.emoji === emoji),
    );
    // Push the new starboard to the array
    newStarboardsArray.push(data);
    // Save the updated array
    db.set("starboards", newStarboardsArray);
    // Don't forget to return something!
    return true;
  }
};

// Create a new instance of your new class
const manager = new StarboardsManagerCustomDb(client, {
  storage: false, // Important - use false instead of a storage path
});
// We now have a starboardsManager property to access the manager everywhere!
client.starboardsManager = manager;

client.on("ready", () => {
  console.log("I'm ready !");
});

client.login("SUP3R_S3CR3T_T0K3N");
```

After that, it works the same as before! The module takes care of the rest!
