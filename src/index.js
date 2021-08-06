/* eslint-disable no-unused-vars */
const { EventEmitter } = require('events');
const { promisify } = require('util');
const Discord = require('discord.js');

const { writeFile, readFile, exists } = require('fs');
const writeFileAsync = promisify(writeFile);
const existsAsync = promisify(exists);
const readFileAsync = promisify(readFile);

const handleRaw = require('./handlers/raw');
const handleMsgDelete = require('./handlers/messageDelete');

const { StarBoardCreateDefaultsOptions } = require('./constants');
const Starboard = require('./bases/Starboard');


/**
 * Starboards Manager
 */
class StarboardsManager extends EventEmitter {

	/**
     * @param {Discord.Client} client The discord client
     * @param {*} options The manager options
     */
	constructor(client, options = {}) {
		super();
		if (!client) throw new Error('Client is a required parameter.');

		/**
         * Starboards managed by this manager
         * @type {object[]}
         */
		this.starboards = [];

		/**
         * The discord client
         * @type {Discord.Client}
         */
		this.client = client;

		/**
         * Starboard defaults options
         * @type {StarBoardCreateDefaultsOptions}
         */
		this.defaultsOptions = StarBoardCreateDefaultsOptions;

		/**
         * The manager options
         * @type {object}
         */
		this.options = {
			storage: typeof options.storage === 'boolean' || typeof options.storage === 'string' ? options.storage : './starboards.json',
			translateClickHere: typeof options.translateClickHere === 'function' ? options.translateClickHere : (msg) => (options.translateClickHere ? options.translateClickHere : 'Jump to the message'),
		};

		this._init();

		this.client.on('channelDelete', channel => {
			const channelData = this.starboards.find(data => data.channelId === channel.id);
			if (channelData) return this.delete(channelData.channelId);
		});
		this.client.on('raw', packet => handleRaw(this, packet));
		this.client.on('messageDelete', message => handleMsgDelete(this, message));

	}

	/**
     * Init the manager
     * @ignore
     * @private
     */
	async _init() {
		const allStarboards = await this.getAllStarboards();
		this.starboards = allStarboards.map(s => new Starboard(s.channelId, s.guildId, s.options, this));
	}

	/**
     * Get the final options by mixing the options provided and the default options
     * @param {object} options
     * @private
     */
	_mergeOptions(options) {
		if(!options) return this.defaultsOptions;

		if(options.threshold && typeof options.threshold === 'string') options.threshold = parseInt(options.threshold, 10);

		return {
			emoji: typeof options.emoji === 'string' ? options.emoji : this.defaultsOptions.emoji,
			starBotMsg: typeof options.starBotMsg === 'boolean' ? options.starBotMsg : this.defaultsOptions.starBotMsg,
			selfStar: typeof options.selfStar === 'boolean' ? options.selfStar : this.defaultsOptions.selfStar,
			starEmbed: typeof options.starEmbed === 'boolean' ? options.starEmbed : this.defaultsOptions.starEmbed,
			attachments: typeof options.attachments === 'boolean' ? options.attachments : this.defaultsOptions.attachments,
			resolveImageUrl: typeof options.resolveImageUrl === 'boolean' ? options.resolveImageUrl : this.defaultsOptions.resolveImageUrl,
			threshold: typeof options.threshold === 'number' ? options.threshold : this.defaultsOptions.threshold,
			color: options.color ? options.color : this.defaultsOptions.color,
			allowNsfw: options.allowNsfw ? options.allowNsfw : this.defaultsOptions.allowNsfw,
			ignoredChannels: options.ignoredChannels ? options.ignoredChannels : [],
			handleMessageDelete: options.handleMessageDelete ? options.handleMessageDelete : false,
		};
	}

	/**
     * Create a Starboard and save it in the database
     * @param {Discord.Channel} channel
     * @param {StarBoardCreateDefaultsOptions} options
     * @example
     * manager.create(message.channel, {
     *      starBotMsg: false,
     *      threshold: 2,
     * })
     */
	create(channel, options) {

		const starboard = new Starboard(channel.id, channel.guild.id, this._mergeOptions(options), this);

		const match = starboard.options.emoji.match(/\d+/g);
		if(match) starboard.options.emoji = match.pop();

		if(this.starboards.find(data => data.channelId === starboard.channelId && data.options.emoji === starboard.options.emoji)) throw new Error('There is already a starboard in this channel with the same emoji');

		this.starboards.push(starboard);
		this.saveStarboard(starboard.toObject());

		this.emit('starboardCreate', starboard);

		return true;
	}

	/**
     * Delete a starboard by its guildId
     * @param {Discord.Snowflake} guildId
	 * @param {String} emoji
     * @example
     * manager.delete(message.channel.id)
     */
	delete(channelId, emoji) {

		const match = emoji.match(/\d+/g);
		if(match) emoji = match.pop();

		const data = this.starboards.find(channelData => channelData.channelId === channelId && channelData.options.emoji === emoji);
		if(!data) throw new Error(`The channel "${channelId}" is not a starboard`);

		this.starboards = this.starboards.filter(channelData => !(channelData.channelId === channelId && channelData.options.emoji === emoji));

		this.deleteStarboard(channelId, emoji);

		this.emit('starboardDelete', data);

		return true;
	}

	/**
	 * Edit a starboard
	 * @param {Discord.Snowflake} channelId
	 * @param {String} emoji
	 * @param {StarBoardCreateDefaultsOptions} data
	 * @returns {Promise<Starboard>}
	 */
	edit(channelId, emoji, data) {
		return new Promise((resolve, reject) => {
			const starboard = this.starboards.find((g) => g.channelId === channelId && g.options.emoji === emoji);
			if (!starboard) {
				return reject('No Starboard found.');
			}
			const old = starboard.toObject();
			starboard.edit(data).then(newStarboard => {
				this.emit('starboardEdited', old, newStarboard);
				resolve(newStarboard);
			}).catch(reject);
		});
	}

	/**
     * Get a list of all starboards in the database.
     * @returns {Promise<object[]>}
     */
	async getAllStarboards() {
		// Whether the storage file exists, or not
		const storageExists = await existsAsync(this.options.storage);
		// If it doesn't exists
		if (!storageExists) {
			// Create the file with an empty array
			await writeFileAsync(this.options.storage, '[]', 'utf-8');
			return [];
		}
		else {
			// If the file exists, read it
			const storageContent = await readFileAsync(this.options.storage);
			try {
				const starboards = await JSON.parse(storageContent.toString());
				if (Array.isArray(starboards)) {
					return Array.from(starboards);
				}
				else {
					console.log(storageContent, starboards);
					throw new SyntaxError('The storage file is not properly formatted (starboards is not an array).');
				}
			}
			catch (e) {
				if (e.message === 'Unexpected end of JSON input') {
					throw new SyntaxError('The storage file is not properly formatted (Unexpected end of JSON input).');
				}
				else {
					throw e;
				}
			}
		}
	}

	/**
     * Delete a starboard of the database
     * @param {Discord.Snowflake} channelId
	 * @param {String} emoji
     */
	async deleteStarboard(channelId, emoji) {
		await writeFileAsync(
			this.options.storage,
			JSON.stringify(Array.from(this.starboards.map(e => {
				return {
					channelId: e.channelId,
					guildId: e.guildId,
					options: e.options,
				};
			}))),
			'utf-8',
		);
		return true;
	}

	/**
     * Save a starboard in the database
     * @param {object} data
     */
	async saveStarboard(data) {
		await writeFileAsync(
			this.options.storage,
			JSON.stringify(Array.from(this.starboards.map(e => {
				return {
					channelId: e.channelId,
					guildId: e.guildId,
					options: e.options,
				};
			}))),
			'utf-8',
		);
		return true;
	}

	/**
     * Edit a starboard in the database
     * @param {object} data
     */
	async editStarboard(channelId, emoji, data) {
		await writeFileAsync(
			this.options.storage,
			JSON.stringify(Array.from(this.starboards.map(e => {
				return {
					channelId: e.channelId,
					guildId: e.guildId,
					options: e.options,
				};
			}))),
			'utf-8',
		);
		return true;
	}

}

/**
 * Emitted when a starboard is created
 * @event StarboardsManager#starboardCreate
 * @param {object} data The channel data
 *
 * @example
 * // This can be used to add features such as a log message
 * manager.on('starboardCreate', (data) => {
 *     console.log(`New starboard ! ChannelID: ${data.channelId}`);
 * });
 */

/**
 * Emitted when a starboard is deleted
 * @event StarboardsManager#starboardDelete
 * @param {object} data The channel data
 *
 * @example
 * // This can be used to add features such as a log message
 * manager.on('starboardDelete', (data) => {
 *     console.log(`Starboard deleted ! ChannelID: ${data.channelId}`);
 * });
*/

/**
 * Emitted when a new reaction for a starboard is received, whether the message is cached or not.
 * @event StarboardsManager#starboardReactionAdd
 * @param {string} emoji The emoji
 * @param {Discord.Message} message The message
 * @param {Discord.User} user The user who reacted
 * @example
 * // This can be used to add features such as a an additional filter so that only certain roles have access to the starboard
 * manager.on('starboardReactionAdd', (emoji, message, user) => {
 *      console.log(`${user.username} reacted to a message with ${emoji}.`)
 * });
 */

/**
 * Emitted when a reaction for a starboard is removed, whether the message is cached or not.
 * @event StarboardsManager#starboardReactionRemove
 * @param {string} emoji The emoji
 * @param {Discord.Message} message The message
 * @param {Discord.User} user The user who reacted
 * @example
 * manager.on('starboardReactionRemove', (emoji, message, user) => {
 *      console.log(`${user.username} remove his reaction to a message.`)
 * });
 */

/**
 * Emitted when all reactions to a starboard message are removed, whether the message is cached or not.
 * @event StarboardsManager#starboardReactionRemoveAll
 * @param {Discord.Message} message The message
 * @example
 * manager.on('starboardReactionRemoveAll', (message) => {
 *      console.log(`Message ${message.id} purged.`)
 * });
 */

/**
 * Emitted when a user reacts to a message in a nsfw channel and the `allowNsfw` option is disabled.
 * @event StarboardsManager#starboardReactionNsfw
 * @param {string} emoji The emoji
 * @param {Discord.Message} message The message
 * @param {Discord.User} user The user who reacted
 * @example
 * manager.on('starboardReactionNsfw', (emoji, message, user) => {
 *      message.channel.send(`${user.username}, you cannot add messages from an nsfw channel to the starboard.`)
 * });
 */

/**
 * Emitted when a user reacts to his own message and the `selfStar` option is disabled.
 * @event StarboardsManager#starboardNoSelfStar
 * @param {string} emoji The emoji
 * @param {Discord.Message} message The message
 * @param {Discord.User} user The user who reacted
 * @example
 * manager.on('starboardNoSelfStar', (emoji, message, user) => {
 *      message.channel.send(`${user.username}, you cannot star your own messages.`)
 * });
 */

/**
 * Emitted when a user reacts to a bot message and the `starBot` option is disabled.
 * @event StarboardsManager#starboardNoStarBot
 * @param {string} emoji The emoji
 * @param {Discord.Message} message The message
 * @param {Discord.User} user The user who reacted
 * @example
 * manager.on('starboardNoStarBot', (emoji, message, user) => {
 *      message.channel.send(`${user.username}, you cannot star bot messages.`)
 * });
 */

/**
 * Emitted when a user reacts to a message that is already in the starboard.
 * @event StarboardsManager#starboardAlreadyStarred
 * @param {string} emoji The emoji
 * @param {Discord.Message} message The message
 * @param {Discord.User} user The user who reacted
 * @example
 * manager.on('starboardAlreadyStarred', (emoji, message, user) => {
 *      message.channel.send(`${user.username}, this message is already in the starboard.`)
 * });
 */

/**
 * Emitted when a user reacts to a message without exploitable content for the starboard
 * @event StarboardsManager#starboardNoEmptyMsg
 * @param {string} emoji The emoji
 * @param {Discord.Message} message The message
 * @param {Discord.User} user The user who reacted
 * @example
 * manager.on('starboardNoEmptyMsg', (emoji, message, user) => {
 *      message.channel.send(`${user.username}, you cannot star an empty message.`)
 * });
 */

/**
 * Emitted when a starboard is edited
 * @event StarboardsManager#starboardEdited
 * @param {Starboard} old The old starboard
 * @param {Starboard} new The new starboard
 * manager.on('starboardEdited', data => {
 *      message.channel.send(`Starboard (channel ${data.channelId}) edited !`)
 * });
 */

module.exports = StarboardsManager;
