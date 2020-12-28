class Starboard {
	constructor(channelID, guildID, options, manager) {
		this.channelID = channelID;
		this.guildID = guildID;
		this.options = options;
		this.manager = manager;
	}

	/**
	 * Gets the top of the most starred messages of this leaderboard
	 * @param {Discord.Snowflake} guildID
	 * @param {String} emoji
	 * @param {Number} count
	 */
	async leaderboard(count = 10) {
		const data = this.manager.starboards.find(s => s.guildID === this.guildID && s.options.emoji === this.options.emoji);
		if(!data) throw new Error('No starboard found for the parameters provided');

		const starChannel = this.manager.client.channels.cache.get(data.channelID);
		if (!starChannel) throw new Error(`The channel with id ${data.channelID} no longer exists or is not in the cache.`);

		const fetchedMessages = await starChannel.messages.fetch({ limit: 100 });

		return fetchedMessages
			.filter(m => m.embeds[0] && m.embeds[0].footer && m.embeds[0].footer.text.startsWith(this.options.emoji))
			.map(m => {
				const regex = new RegExp(`^${this.options.emoji}\\s([0-9]{1,3})\\s\\|\\s([0-9]{17,20})`);
				const star = regex.exec(m.embeds[0].footer.text);
				m.stars = parseInt(star[1]);
				return m;
			})
			.sort((a, b) => b.stars - a.stars)
			.slice(0, count);
	}
}

module.exports = Starboard;