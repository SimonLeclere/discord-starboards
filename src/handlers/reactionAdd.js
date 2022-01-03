const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio').default;

module.exports = async (manager, emoji, message, user) => {

	const data = manager.starboards.find(channelData => channelData.guildId === message.guild.id && channelData.options.emoji === emoji);
	if(!data) return;

	const starChannel = manager.client.channels.cache.get(data.channelId);
	if (!starChannel || data.options.ignoredChannels.includes(message.channel.id)) return;

	if(emoji !== data.options.emoji || user.bot) return;

	if(!data.options.allowNsfw && message.channel.nsfw) {
		message.reactions.resolve(emoji).users.remove(user.id);
		return manager.emit('starboardReactionNsfw', emoji, message, user);
	}

	if (!data.options.selfStar && message.author.id === user.id) {
		message.reactions.resolve(emoji).users.remove(user.id);
		return manager.emit('starboardNoSelfStar', emoji, message, user);
	}

	if (!data.options.starBotMsg && message.author.bot) {
		message.reactions.resolve(emoji).users.remove(user.id);
		return manager.emit('starboardNoStarBot', emoji, message, user);
	}

	const reaction = message.reactions.cache.get(emoji);
	if(reaction && reaction.count < data.options.threshold) return;

	const fetchedMessages = await starChannel.messages.fetch({ limit: 100 });
	const starMessage = fetchedMessages.find(m => m.embeds[0] && m.embeds[0].footer && m.embeds[0].footer.text.endsWith(message.id) && m.author.id === manager.client.user.id);

	if (starMessage) {

		const regex = new RegExp(`^(${data.options.emoji}|" ")?\\s?([0-9]{1,3})\\s\\|\\s([0-9]{17,20})`);
		const stars = regex.exec(starMessage.embeds[0].footer.text);
		const foundStar = starMessage.embeds[0];
		const image = foundStar.image && foundStar.image.url || '';
		const footerUrl = emoji.length > 5 ? `https://cdn.discordapp.com/emojis/${emoji}` : null;
		const count = reaction && reaction.count ? reaction.count : parseInt(stars[2]) + 1;

		const starEmbed = new MessageEmbed()
			.setColor(getColor(data.options.color, count) || foundStar.color)
			.setDescription(foundStar.description || '')
			.setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
			.setTimestamp()
			.setFooter({ text: `${emoji.length > 5 ? '' : data.options.emoji} ${count} | ${message.id}`, iconURL: footerUrl })
			.setImage(image);
		const starMsg = await starChannel.messages.fetch(starMessage.id);
		// eslint-disable-next-line no-empty-function
		await starMsg.edit({ embeds: [starEmbed] }).catch(() => {});
		manager.emit('starboardReactionAdd', emoji, message, user);
	}

	if (!starMessage) {

		let embedImage = '';
		let embedContent = '';

		if(message.embeds.length > 0 && data.options.starEmbed) {
			if(message.embeds[0].footer && message.embeds[0].footer.text) {
				const alreadyInStarboard = !!fetchedMessages.find(m => m.embeds[0] && m.embeds[0].footer && m.embeds[0].footer.text.startsWith(data.options.emoji) && m.embeds[0].footer.text.endsWith(message.embeds[0].footer.text.split(' | ')[1]));
				if(alreadyInStarboard) return manager.emit('starboardAlreadyStarred', emoji, message, user);
			}
			embedImage = message.embeds[0].image;
			embedContent = message.embeds[0].description;
		}


		let content = '';
		if(message.cleanContent) content = message.cleanContent.length > 2000 ? message.cleanContent.slice(0, 2000) + '\n...' : message.cleanContent;
		else content = embedContent ? embedContent : '';


		let image = data.options.attachments ? (message.attachments.size > 0 ? await extension([...message.attachments.values()][0].url) : '') : '';
		if(image === '') image = embedImage ? embedImage.url ? embedImage.url : '' : '';
		if(image === '' && data.options.resolveImageUrl) {
			const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
			let url = content.match(regex);
			if(/https?:\/\/tenor.com\/view\/[^ ]*/.test(url)) {
				const response = await axios.get(url[0]).catch(() => null);
				if(response) {
					const $ = cheerio.load(response.data);
					const src = $('meta[property="og:url"]', 'head').attr('content');
					if(src) image = src;
				}
			}
			else if(url) {
				url = url[0];
				const response = await axios.get(url).catch(() => null);
				if(response) {
					const mimeType = response.headers['content-type'];
					if(mimeType.startsWith('image/')) image = url;
				}
			}
		}


		if (image === '' && content === '') return manager.emit('starboardNoEmptyMsg', emoji, message, user);

		const footerUrl = emoji.length > 5 ? `https://cdn.discordapp.com/emojis/${emoji}` : null;
		const starEmbed = new MessageEmbed()
			.setColor(getColor(data.options.color))
			.setDescription(`${content}\n${image === 'attachment' ? '[attachment]\n' : ''}\n[${manager.options.translateClickHere(message)}](${message.url})`)
			.setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
			.setTimestamp()
			.setFooter({ text: `${emoji.length > 5 ? '' : data.options.emoji} ${reaction && reaction.count ? reaction.count : 1} | ${message.id}`, iconURL: footerUrl })
			.setImage(image !== 'attachment' ? image : '');
		starChannel.send({ embeds: [starEmbed] });
		manager.emit('starboardReactionAdd', emoji, message, user);
	}

};

function extension(attachment) {
	const imageLink = attachment.split('.');
	const typeOfImage = imageLink[imageLink.length - 1];
	const image = /(jpg|jpeg|png|gif)/gi.test(typeOfImage);
	if (!image) return 'attachment';
	return attachment;
}

function getColor(color, stars = 1) {
	if(typeof color === 'string') return color;

	else if (typeof color === 'object' && color.colors && color.max) {
		const indice = Math.max(Math.min(Math.floor(stars - 1 / color.max * color.colors.length), color.colors.length - 1), 0);
		return color.colors[indice];
	}

	else return null;
}
