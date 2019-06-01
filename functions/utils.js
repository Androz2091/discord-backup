/**
 * Gets OverwritesPermission for a guild channel
 * @param {object} GuildChannel 
 * @returns The OverwritesPermission
 */
function fetchOverwritesPermission(GuildChannel){
    let permOverwrites = [];
    GuildChannel.permissionOverwrites.filter((p) => p.type === "role").forEach((perm) => { // For each overwrites permission
        let role = GuildChannel.guild.roles.get(perm.id);
        if(role){
            permOverwrites.push({
                roleName: role.name,
                perm: permOverwrites.perm,
                allow: perm.allow,
                deny: perm.deny
            });
        }
    });
    return permOverwrites;
}

/**
 * This function fetches the channel data that are necessary for the backup
 * @param {object} GuildChannel The discord channel
 * @returns The channel data
 */
async function fetchChannelData(GuildChannel){
    return new Promise(async function(resolve, reject){
        let channelData = {};
        if(GuildChannel.type === "text"){
            /* Get basic informations */
            channelData.type = "text";
            channelData.name = GuildChannel.name;
            channelData.nsfw = GuildChannel.nsfw;
            channelData.parent = (GuildChannel.parent ? GuildChannel.parent.name : false);
            channelData.topic = GuildChannel.topic;
            channelData.permissionOverwrites = fetchOverwritesPermission(GuildChannel);
            /* Fetch last 100 channel messages */
            GuildChannel.messages.fetch({limit:10}).then((fetched) => {
                let messages = [];
                for(let message of fetched){
                    messages.push({
                        author:{ username: message[1].author.username, avatarURL: message[1].author.displayAvatarURL() },
                        content: message[1].cleanContent,
                        attachments: message[1].attachments,
                        embeds: message.embeds
                    });
                }
                channelData.messages = messages;
                /* Return channel data */
                resolve(channelData);
            }).catch((err) => {
                channelData.messages = [];
                resolve(channelData);
            });
        } else if(GuildChannel.type === "voice"){
            /* Get basic informations */
            channelData.type = "voice";
            channelData.name = GuildChannel.name;
            channelData.bitrate = GuildChannel.bitrate;
            channelData.userLimit = GuildChannel.userLimit;
            channelData.rateLimitPerUser = GuildChannel.rateLimitPerUser;
            channelData.permissionOverwrites = fetchOverwritesPermission(GuildChannel);
            /* Return channel data */
            resolve(channelData);
        }
    });
}

/**
 * Delete all roles, all channels, all emojis, etc... of a guild
 * @param {object} guild
 */
async function clearGuild(guild) {
    //let roleThatGivesMeAdminPermissions = guild.me.roles.filter((r) => r.permissions.has("ADMINISTRATOR"));
    guild.roles.filter((role) => role.editable && role.id !== guild.defaultRole.id).forEach((role) => {
        role.delete().catch((err) => {});
    });
    guild.channels.forEach((channel) => {
        channel.delete().catch((err) => {});
    });
    guild.emojis.forEach((emoji) => {
        emoji.delete().catch((err) => {});
    });
    let webhooks = await guild.fetchWebhooks();
    webhooks.forEach((webhook) => {
        webhook.delete().catch((err) => {});
    });
    let bans = await guild.fetchBans();
    bans.forEach((ban) => {
        guild.members.unban(ban.user).catch((err) => {});
    });
    return;
}

/**
 * Creates a category for the guild
 * @param {object} categoryData The data of the category to create
 * @param {object} guild The discord guild
 * @returns The category
 */
async function loadCategory(categoryData, guild){
    return new Promise(function(resolve, reject){
        guild.channels.create(categoryData.name, { // Create the category
            type: "category"
        }).then(async (category) => { // When the category is created
            var permOverwrites = [];
            categoryData.permissionOverwrites.forEach((perm) => {
                var role = guild.roles.find((r) => r.name === perm.roleName);
                if(role){
                    permOverwrites.push({
                        id: role.id,
                        allow: perm.allow,
                        deny: perm.deny
                    });
                }
            });
            await category.overwritePermissions({ // Update category permissions
                permissionOverwrites: permOverwrites
            });
            resolve(category); // Return the category
        });
    });
}

/**
 * Create a channel and returns it
 * @param {object} channelData The channel Data
 * @param {object} category The parent category of the channel (optional)
 * @param {object} guild The guild on which the category will be created
 * @returns The channel
 */
async function loadChannel(channelData, category, guild){
    return new Promise(async function(resolve, reject){
        guild.channels.create(channelData.name, {
            type: channelData.type,
            topic: channelData.topic,
            nsfw: channelData.nsfw,
            rateLimitPerUser: channelData.rateLimitPerUser,
            parent: category,
            bitrate: channelData.bitrate,
            userLimit: channelData.userLimit
        }).then(async (channel) => {
            /* Update channel permissions */
            var permOverwrites = [];
            channelData.permissionOverwrites.forEach((perm) => {
                var role = guild.roles.find((r) => r.name === perm.roleName);
                if(role){
                    permOverwrites.push({
                        id: role.id,
                        allow: perm.allow,
                        deny: perm.deny
                    });
                }
            });
            await channel.overwritePermissions({ // Update category permissions
                permissionOverwrites: permOverwrites
            });
            /* Load messages */
            if(channelData.type === "text"){
                channel.createWebhook("MessagesBackup", {
                    avatar: channel.client.user.displayAvatarURL
                }).then(async (webhook) => {
                    var messages = channelData.messages.filter((m) => m.content.length > 0).reverse();
                    for(var msg of messages){
                        webhook.send(msg.content, {
                            username: msg.author.username,
                            avatarURL: msg.author.avatarURL,
                            files: msg.attachments,
                            embeds: msg.embeds
                        });
                    }
                    resolve(channel); // Return the channel
                });
            } else {
                resolve(channel); // Return the channel
            }
        });
    });
}

module.exports = {
    fetchOverwritesPermission,
    fetchChannelData,
    clearGuild,
    loadChannel,
    loadCategory
};