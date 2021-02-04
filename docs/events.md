# Events

Instead of sending confirmation messages for example, you can use events integrated in the module. These give you more flexibility, including the possibility to translate messages. There are many different events available, including the following:

<br>

## starboardCreate

This event is emitted when a starboard is created. It can be used to send a confirmation message in the starboard's channel, to set up a log system, ...
The callback function is invoked with the new starboard as argument.

```js
manager.on('starboardCreate', (data) => {
    const channel = client.channels.cache.get(data.channelID);
    channel.send(`This channel is now a starboard!`);
});
```

<br>

## starboardDelete

This event is emitted when a starboard is deleted or when the channel of this starboard is deleted. It can be used to send a confirmation message in the starboard channel, to make a log system, ...
The callback function is invoked with the deleted starboard as argument.

```js
manager.on('starboardDelete', (data) => {
    const channel = client.channels.cache.get(data.channelID);
    if (channel) channel.send(`Starboard deleted ! ChannelID: ${data.channelID}`);
});
```

<br>

## starboardReactionAdd

This event is emitted when a user reacts to a message eligible for the starboard, whether the message is cached or not. If the message does not meet the criteria of the options (ex: allowNsfw, starBotMsg, ...) then the event will not be emitted.
The callback function is invoked with the emoji, the message and the user as arguments.

```js
manager.on('starboardReactionAdd', (emoji, message, user) => {
    console.log(`${user.username} reacted to a message with ${emoji} (message id: ${message.id}).`);
});
```

<br>

## starboardReactionRemove

Like the `starboardReactionAdd` event, this event is emitted when a user removes his reaction from an eligible message to the starboard, whether it is cached or not.
The callback function is invoked with the emoji, the message and the user as arguments.

```js
manager.on('starboardReactionRemove', (emoji, message, user) => {
     console.log(`${user.username} remove his reaction (${emoji}) to a message (id: ${message.id}).`)
});
```

<br>

## starboardReactionRemoveAll

This event is emitted when all reactions of a message are deleted at once.
The callback function is invoked with the message as argument.

```js
manager.on('starboardReactionRemoveAll', (message) => {
     console.log(`The reactions of the message with id ${message.id} have all been removed.`)
});
```

## starboardReactionNsfw

This event is emitted when a user reacts to a message in an nsfw channel whereas the starboard corresponding to his reaction has the allowNsfw option disabled.
The callback function is invoked with the emoji, the message and the user as arguments.

```js
manager.on('starboardReactionNsfw', (emoji, message, user) => {
    message.channel.send(`${user.username}, you cannot add messages from an nsfw channel to the starboard.`)
});
```

## starboardNoSelfStar

This event is emitted when a user reacts to a message whereas the starboard corresponding to his reaction has the selfStar option disabled.
The callback function is invoked with the emoji, the post and the user as arguments.

```js
manager.on('starboardNoSelfStar', (emoji, message, user) => {
    message.channel.send(`${user.username}, you cannot star your own messages.`)
});
```

## starboardNoStarBot

This event is emitted when a user reacts to a bot message whereas the starboard corresponding to his reaction has the starBot option disabled.
The callback function is invoked with the emoji, the message and the user as arguments.

```js
manager.on('starboardNoStarBot', (emoji, message, user) => {
    message.channel.send(`${user.username}, you cannot star bot messages.`)
});
```

## starboardAlreadyStarred

This event is emitted when a user reacts to a starboard embed with the starStar option disabled.
The callback function is invoked with the emoji, the message and the user as arguments.

```js
manager.on('starboardAlreadyStarred', (emoji, message, user) => {
    message.channel.send(`${user.username}, this message is already in the starboard.`)
});
```

## starboardNoEmptyMsg

This event is emitted when a user reacts to a message that has no exploitable content. For example, a message that has neither text nor image (like some embeds).
The callback function is invoked with the emoji, the message and the user as arguments.

```js
manager.on('starboardNoEmptyMsg', (emoji, message, user) => {
    message.channel.send(`${user.username}, you cannot star an empty message.`)
});
```

## starboardEdited

This event is emitted when a starboard is modified.
The callback function is invoked with the old starboard and the new starboard as arguments.

```js
manager.on('starboardEdited', (old, new) => {
     message.channel.send(`Starboard (channel ${new.channelID}) edited !`)
});
```