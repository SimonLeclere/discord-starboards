const { MessageEmbed } = require('discord.js');

module.exports = async (manager, message) => {

	const starboards = manager.starboards.filter(channelData => channelData.guildID === message.guild.id);
	if(!starboards) return;

	starboards.forEach(async data => {

		const starChannel = manager.client.channels.cache.get(data.channelID);
		if (!starChannel) return;

		manager.emit('starboardReactionRemoveAll', message);

		const fetchedMessages = await starChannel.messages.fetch({ limit: 100 });
		const stars = fetchedMessages.find(m => m.embeds[0] && m.embeds[0].footer && m.embeds[0].footer.text.startsWith(data.options.emoji) && m.embeds[0].footer.text.endsWith(message.id));
		if (stars) {
			const foundStar = stars.embeds[0];
			const image = data.options.attachments ? (message.attachments.size > 0 ? await extension(message.attachments.array()[0].url) : '') : '';
			const starEmbed = new MessageEmbed()
				.setColor(foundStar.color)
				.setDescription(foundStar.description || '')
				.setAuthor(message.author.tag, message.author.displayAvatarURL())
				.setTimestamp()
				.setFooter(`${data.options.emoji} 0 | ${message.id}`)
				.setImage(image);
			const starMsg = await starChannel.messages.fetch(stars.id);
			await starMsg.edit({ embed: starEmbed });
			return starMsg.delete({ timeout: 1000 });
		}

	});

};

function extension(attachment) {
	const imageLink = attachment.split('.');
	const typeOfImage = imageLink[imageLink.length - 1];
	const image = /(jpg|jpeg|png|gif)/gi.test(typeOfImage);
	if (!image) return '';
	return attachment;
}