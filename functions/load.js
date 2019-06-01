const utils = require("./utils");

module.exports = {
    /**
     * Restore guild configuration
     * @param {object} guild The discord guild
     * @param {object} conf The configuration
     */
    async configuration(guild, conf){
        guild.setName(guild.name);
        guild.setIcon(guild.icon);
        guild.setRegion(guild.region);
        guild.setVerificationLevel(guild.verificationLevel);
        guild.setDefaultMessageNotifications(guild.defaultMessageNotifications);
        guild.setExplicitContentFilter(guild.explicitContentFilter);
        return true;
    },

    /**
     * Restore guild roles
     * @param {object} guild The discord guild
     * @param {object} conf The configuration
     */
    async roles(guild, conf){
        conf.roles.forEach((roleData) => {
            guild.roles.create({ // Create the role
                data: {
                    name: roleData.name,
                    color: roleData.color,
                    hoist: roleData.hoist,
                    permissions: roleData.permissions,
                    mentionable: roleData.mentionable
                }
            });
        });
        return true;
    },

    /**
     * Restore guild channels
     * @param {object} guild The discord guild
     * @param {object} conf The configuration
     */
    async channels(guild, conf){
        conf.channels.categories.forEach((category) => {
            utils.loadCategory(category, guild).then((CategoryChannel) => {
                category.children.forEach((channel) => {
                    utils.loadChannel(channel, CategoryChannel, guild);
                });
            });
        });
        return true;
    },

    /**
     * Restore afk configuration
     * @param {object} guild The discord guild
     * @param {object} conf The configuration
     */
    async afk(guild, conf){
        if(conf.AFK){
            guild.setAfkChannel(guild.channels.find((ch) => ch.name === conf.AFK.name));
            guild.setAfkTimeout(conf.AFK.timeout);
        }
        return true;
    },

    /**
     * Restore guild emojis
     * @param {object} guild The discord guild
     * @param {object} conf The configuration
     */
    async emojis(guild, conf){
        conf.emojis.forEach((emoji) => {
            guild.emojis.create(emoji.url, emoji.name);
        });
        return true;
    },

    /**
     * Restore guild bans
     * @param {object} guild The discord guild
     * @param {object} conf The configuration
     */
    async bans(guild, conf){
        conf.bans.forEach((ban) => {
            guild.members.ban(ban.id, {
                reason: ban.reason
            });
        });
        return true;
    },

    /**
     * Restore embedChannel configuration
     * @param {object} guild The discord guild
     * @param {object} conf The configuration
     */
    async embedChannel(guild, conf){
        if(conf.embedChannel){
            guild.setEmbed({
                enabled: conf.embed.enabled,
                channel: guild.channels.find((ch) => ch.name === conf.embed.channel)
            });
        }
        return true;
    }

};