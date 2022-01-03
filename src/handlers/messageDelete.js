const { MessageEmbed } = require('discord.js');

module.exports = async (manager, message) => {

	const starboards = manager.starboards.filter(channelData => channelData.guildId === message.guild.id);
	if(!starboards) return;

	starboards.forEach(async data => {

		const starChannel = manager.client.channels.cache.get(data.channelId);
		if (!starChannel || data.options.ignoredChannels.includes(message.channel.id) || !data.options.handleMessageDelete) return;

		const fetchedMessages = await starChannel.messages.fetch({ limit: 100 });
		const starMessage = fetchedMessages.find(m => m.embeds[0] && m.embeds[0].footer && m.embeds[0].footer.text.endsWith(message.id) && m.author.id === manager.client.user.id);
		if (starMessage) {
			const foundStar = starMessage.embeds[0];
			const image = foundStar.image && foundStar.image.url || '';
			const starEmbed = new MessageEmbed()
				.setColor(foundStar.color)
				.setDescription(foundStar.description || '')
				.setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
				.setTimestamp()
				.setFooter({ text: `${data.options.emoji} 0 | ${message.id}` })
				.setImage(image);
			const starMsg = await starChannel.messages.fetch(starMessage.id);
			await starMsg.edit({ embeds: [starEmbed] });

			setTimeout(() => {
				starMsg.delete();

			}, 1000);

			return starMsg;
		}

	});

};
