const { MessageEmbed } = require('discord.js');

module.exports = async (manager, message) => {

	const starboards = manager.starboards.filter(channelData => channelData.guildID === message.guild.id);
	if(!starboards) return;

	manager.emit('starboardReactionRemoveAll', message);

	starboards.forEach(async data => {

		const starChannel = manager.client.channels.cache.get(data.channelID);
		if (!starChannel || data.options.ignoredChannels.includes(message.channel.id)) return;

		const fetchedMessages = await starChannel.messages.fetch({ limit: 100 });
		const starMessage = fetchedMessages.find(m => m.embeds[0] && m.embeds[0].footer && m.embeds[0].footer.text.endsWith(message.id) && m.author.id === manager.client.user.id);
		if (starMessage) {
			const foundStar = starMessage.embeds[0];
			const image = foundStar.image && foundStar.image.url || '';
			const starEmbed = new MessageEmbed()
				.setColor(foundStar.color)
				.setDescription(foundStar.description || '')
				.setAuthor(message.author.tag, message.author.displayAvatarURL())
				.setTimestamp()
				.setFooter(`${data.options.emoji} 0 | ${message.id}`)
				.setImage(image);
			const starMsg = await starChannel.messages.fetch(starMessage.id);
			await starMsg.edit({ embed: starEmbed });
			return starMsg.delete({ timeout: 1000 });
		}

	});

};