/**
 * The default create options for new starboards
 * @typedef StarBoardCreateDefaultsOptions
 *
 * @property {String} emoji The emoji to react with in order to get the message into the starboard
 * @property {Boolean} starBotMsg Whether or not the messages from bots can be starred
 * @property {Boolean} selfStar Whether users can star their own messages or not
 * @property {Boolean} attachments Whether images can be starred or not
 * @property {Number} threshold The number of reactions it takes before a message enters the starboard
 * @property {String} color The color of the embeds of the starboard messages
 */
exports.StarBoardCreateDefaultsOptions = {
	emoji: '⭐',
	starBotMsg: true,
	selfStar: true,
	attachments: true,
	threshold: 1,
	color: '#f1c40f',
};