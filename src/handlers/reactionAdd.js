const { MessageEmbed } = require('discord.js');

module.exports = async (manager, emoji, message, user) => {


	const data = manager.starboards.find(channelData => channelData.guildID === message.guild.id && channelData.options.emoji === emoji);
	if(!data) return;

	const starChannel = manager.client.channels.cache.get(data.channelID);
	if (!starChannel) return;


	if(emoji !== data.options.emoji || user.bot) return;

	if (message.author.id === user.id && !data.options.selfStar) return message.channel.send(manager.options.messages.selfStar);
	if (message.author.bot && !data.options.starBotMsg) return message.channel.send(manager.options.messages.starbot);

	manager.emit('starboardReactionAdd', emoji, message, user);

	const reaction = message.reactions.cache.get(emoji);
	if(reaction && reaction.count < data.options.threshold) return;

	const fetchedMessages = await starChannel.messages.fetch({ limit: 100 });
	const stars = fetchedMessages.find(m => m.embeds[0] && m.embeds[0].footer && m.embeds[0].footer.text.startsWith(data.options.emoji) && m.embeds[0].footer.text.endsWith(message.id));

	if (stars) {
		const regex = new RegExp(`^${data.options.emoji}\\s([0-9]{1,3})\\s\\|\\s([0-9]{17,20})`);
		const star = regex.exec(stars.embeds[0].footer.text);
		const foundStar = stars.embeds[0];
		const image = data.options.attachments ? (message.attachments.size > 0 ? await extension(message.attachments.array()[0].url) : '') : '';
		const starEmbed = new MessageEmbed()
			.setColor(foundStar.color)
			.setDescription(foundStar.description || '')
			.setAuthor(message.author.tag, message.author.displayAvatarURL())
			.setTimestamp()
			.setFooter(`${data.options.emoji} ${reaction && reaction.count ? reaction.count : parseInt(star[1]) + 1} | ${message.id}`)
			.setImage(image);
		const starMsg = await starChannel.messages.fetch(stars.id);
		// eslint-disable-next-line no-empty-function
		await starMsg.edit({ embed: starEmbed }).catch(() => {});

	}

	if (!stars) {

		const image = data.options.attachments ? (message.attachments.size > 0 ? await extension(message.attachments.array()[0].url) : '') : '';
		if (image === '' && message.cleanContent.length < 1) return message.channel.send(manager.options.messages.emptyMsg);

		const content = message.cleanContent.length > 2000 ? message.cleanContent.slice(0, 2000) + '\n...' : message.cleanContent;

		const starEmbed = new MessageEmbed()
			.setColor(data.options.color)
			.setDescription(content)
			.setAuthor(message.author.tag, message.author.displayAvatarURL())
			.setTimestamp(new Date())
			.setFooter(`${data.options.emoji} ${reaction && reaction.count ? reaction.count : 1} | ${message.id}`)
			.setImage(image);
		await starChannel.send({ embed: starEmbed });

	}

};

function extension(attachment) {
	const imageLink = attachment.split('.');
	const typeOfImage = imageLink[imageLink.length - 1];
	const image = /(jpg|jpeg|png|gif)/gi.test(typeOfImage);
	if (!image) return '';
	return attachment;
}