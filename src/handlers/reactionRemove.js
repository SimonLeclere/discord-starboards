const { MessageEmbed } = require('discord.js');

module.exports = async (manager, emoji, message, user) => {

	const data = manager.starboards.find(channelData => channelData.guildId === message.guild.id && channelData.options.emoji === emoji);
	if(!data) return;

	const starChannel = manager.client.channels.cache.get(data.channelId);
	if (!starChannel || data.options.ignoredChannels.includes(message.channel.id)) return;

	if(emoji !== data.options.emoji || user.bot) return;
	if(!data.options.allowNsfw && message.channel.nsfw) return;
	if (message.author.id === user.id && !data.options.selfStar) return;
	if (message.author.bot && !data.options.starBotMsg) return;

	manager.emit('starboardReactionRemove', emoji, message, user);

	const reaction = message.reactions.cache.get(emoji);

	const fetchedMessages = await starChannel.messages.fetch({ limit: 100 });
	const starMessage = fetchedMessages.find(m => m.embeds[0] && m.embeds[0].footer && m.embeds[0].footer.text.endsWith(message.id) && m.author.id === manager.client.user.id);
	if (starMessage) {
		const regex = new RegExp(`^(${data.options.emoji}|" ")?\\s?([0-9]{1,3})\\s\\|\\s([0-9]{17,20})`);
		const stars = regex.exec(starMessage.embeds[0].footer.text);
		const foundStar = starMessage.embeds[0];
		const image = foundStar.image && foundStar.image.url || '';
		const footerUrl = emoji.length > 5 ? `https://cdn.discordapp.com/emojis/${emoji}` : null;
		const starEmbed = new MessageEmbed()
			.setColor(getColor(data.options.color, parseInt(stars[2]) - 1) || foundStar.color)
			.setDescription(foundStar.description || '')
			.setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
			.setTimestamp()
			.setFooter({ text: `${emoji.length > 5 ? '' : data.options.emoji} ${parseInt(stars[2]) - 1} | ${message.id}`, iconURL: footerUrl })
			.setImage(image);
		const starMsg = await starChannel.messages.fetch(starMessage.id);
		// eslint-disable-next-line no-empty-function
		await starMsg.edit({ embeds: [starEmbed] }).catch(() => {});
		if(parseInt(stars[2]) - 1 == 0 || reaction && reaction.count < data.options.threshold) {
			setTimeout(() => {
				// eslint-disable-next-line no-empty-function
				starMsg.delete().catch(() => {});
			}, 1000);

			return starMsg;
		}
	}

};

function getColor(color, stars = 1) {
	if(typeof color === 'string') return color;

	else if (typeof color === 'object' && color.colors && color.max) {
		const indice = Math.max(Math.min(Math.floor(stars - 1 / color.max * color.colors.length), color.colors.length - 1), 0);
		return color.colors[indice];
	}

	else return null;
}
