/**
 * Gets OverwritesPermission for a guild channel
 * @param {object} GuildChannel 
 * @returns The OverwritesPermission
 */
function fetchOverwritesPermission(GuildChannel){
    var permOverwrites = [];
    GuildChannel.permissionOverwrites.filter((p) => p.type === "role").forEach((perm) => { // For each overwrites permission
        var role = GuildChannel.guild.roles.get(perm.id);
        permOverwrites.push({
            roleName: role.name,
            perm: permOverwrites.perm,
            allow: perm.allow,
            deny: perm.deny
        });
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
                };
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

module.exports = {
    fetchOverwritesPermission: fetchOverwritesPermission,
    fetchChannelData: fetchChannelData
};