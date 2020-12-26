const handleReactionAdd = require('./reactionAdd');
const handleReactionRemove = require('./reactionRemove');
const handleReactionRemoveAll = require('./reactionRemoveAll');

module.exports = (manager, packet) => {

	// We don't want this to run on unrelated packets
	if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE', 'MESSAGE_REACTION_REMOVE_ALL'].includes(packet.t)) return;

	// Grab the channel to check the message from
	const channel = manager.client.channels.cache.get(packet.d.channel_id);

	channel.messages.fetch(packet.d.message_id).then(async message => {

		// Emit starBoardReactionRemoveAll event
		if(packet.t === 'MESSAGE_REACTION_REMOVE_ALL') return handleReactionRemoveAll(manager, message);

		// Emojis can have identifiers of name:id format, so we have to account for that case as well
		const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;

		await manager.client.users.fetch(packet.d.user_id);

		// Check which type of event it is before emitting
		if (packet.t === 'MESSAGE_REACTION_ADD') return handleReactionAdd(manager, emoji, message, manager.client.users.cache.get(packet.d.user_id));

		if (packet.t === 'MESSAGE_REACTION_REMOVE') handleReactionRemove(manager, emoji, message, manager.client.users.cache.get(packet.d.user_id));
	});

};