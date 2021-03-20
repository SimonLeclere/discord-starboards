/**
 * The default create options for new starboards
 * @typedef StarBoardCreateDefaultsOptions
 *
 * @property {String} emoji The emoji to react with in order to get the message into the starboard. If it's a custom emoji, it must be formatted as <:name:id>.
 * @property {Boolean} starBotMsg Whether or not the messages from bots can be starred
 * @property {Boolean} selfStar Whether users can star their own messages or not
 * @property {Boolean} starEmbed Whether users can star embeds or not. The default value is true.
 * @property {Boolean} resolveImageUrl Whether image links are displayed as an image or as a link. The default value is true.
 * @property {Boolean} attachments Whether images can be starred or not
 * @property {Number} threshold The number of reactions it takes before a message enters the starboard
 * @property {String} color The color of the embeds of the starboard messages
 * @property {Boolean} allowNsfw Whether messages in an nsfw channel can be starred or not. The default value is false.
 */
exports.StarBoardCreateDefaultsOptions = {
	emoji: '⭐',
	starBotMsg: true,
	selfStar: true,
	starEmbed: true,
	resolveImageUrl: true,
	attachments: true,
	threshold: 3,
	color: '#f1c40f',
	allowNsfw: false,
};
