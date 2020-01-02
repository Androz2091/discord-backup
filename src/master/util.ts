import {
    CategoryChannel,
    Collection,
    Guild,
    GuildCreateChannelOptions,
    Message,
    OverwriteData,
    Snowflake,
    TextChannel,
    VoiceChannel,
    WebhookMessageOptions
} from 'discord.js';
import { CategoryData, ChannelPermissionsData, TextChannelData, VoiceChannelData } from '../types';

/**
 * Gets the permissions for a channel
 * @param {GuildChannel} channel The channel
 * @returns {ChannelPermissionsData[]} The permissions
 */
export function fetchChannelPermissions(channel: TextChannel | VoiceChannel | CategoryChannel) {
    const permissions: ChannelPermissionsData[] = [];
    channel.permissionOverwrites
        .filter(p => p.type === 'role')
        .forEach(perm => {
            // For each overwrites permission
            const role = channel.guild.roles.get(perm.id);
            if (role) {
                permissions.push({
                    roleName: role.name,
                    allow: perm.allow.bitfield,
                    deny: perm.deny.bitfield
                });
            }
        });
    return permissions;
}

/**
 * Fetches the voice channel data that is necessary for the backup
 * @param {VoiceChannel} channel The voice channel
 * @returns The channel data
 */
export async function fetchVoiceChannelData(channel: VoiceChannel) {
    return new Promise<VoiceChannelData>(async resolve => {
        const channelData: VoiceChannelData = {
            type: 'voice',
            name: channel.name,
            bitrate: channel.bitrate,
            userLimit: channel.userLimit,
            parent: channel.parent ? channel.parent.name : null,
            permissions: fetchChannelPermissions(channel)
        };
        /* Return channel data */
        resolve(channelData);
    });
}

/**
 * Fetches the text channel data that is necessary for the backup
 * @param {TextChannel} channel The text channel
 * @returns The channel data
 */
export async function fetchTextChannelData(channel: TextChannel) {
    return new Promise<TextChannelData>(async resolve => {
        const channelData: TextChannelData = {
            type: 'text',
            name: channel.name,
            nsfw: channel.nsfw,
            rateLimitPerUser: channel.rateLimitPerUser,
            parent: channel.parent ? channel.parent.name : null,
            topic: channel.topic,
            permissions: fetchChannelPermissions(channel),
            messages: []
        };
        /* Fetch last 100 channel messages */
        channel.messages
            .fetch({ limit: 10 })
            .then((fetched: Collection<Snowflake, Message>) => {
                const messages = [];
                fetched.forEach(msg => {
                    if (!msg.author) {
                        return;
                    }
                    channelData.messages.push({
                        username: msg.author.username,
                        avatar: msg.author.displayAvatarURL(),
                        content: msg.cleanContent
                    });
                });
                /* Return channel data */
                resolve(channelData);
            })
            .catch(err => {
                channelData.messages = [];
                resolve(channelData);
            });
    });
}

/**
 * Creates a category for the guild
 * @param {CategoryData} categoryData The data of the category to create
 * @param {Guild} guild The discord guild
 * @returns The category
 */
export async function loadCategory(categoryData: CategoryData, guild: Guild) {
    return new Promise<CategoryChannel>(resolve => {
        guild.channels.create(categoryData.name, { type: 'category' }).then(async category => {
            // When the category is created
            const finalPermissions: OverwriteData[] = [];
            categoryData.permissions.forEach(perm => {
                const role = guild.roles.find(r => r.name === perm.roleName);
                if (role) {
                    finalPermissions.push({
                        id: role.id,
                        allow: perm.allow,
                        deny: perm.deny
                    });
                }
            });
            await category.overwritePermissions({
                // Update category permissions
                permissionOverwrites: finalPermissions
            });
            resolve(category); // Return the category
        });
    });
}

/**
 * Create a channel and returns it
 * @param {TextChannelData|VoiceChannelData} channelData The channel Data
 * @param {Guild} guild The guild on which the category will be created
 * @param {CategoryChannel} category The parent category of the channel (optional)
 * @returns The channel
 */
export async function loadChannel(
    channelData: TextChannelData | VoiceChannelData,
    guild: Guild,
    category?: CategoryChannel
) {
    return new Promise(async (resolve, reject) => {
        const createOptions: GuildCreateChannelOptions = {
            type: null,
            parent: category
        };
        if (channelData.type === 'text') {
            createOptions.nsfw = (channelData as TextChannelData).nsfw;
            createOptions.rateLimitPerUser = (channelData as TextChannelData).rateLimitPerUser;
            createOptions.type = 'text';
        } else if (channelData.type === 'voice') {
            createOptions.bitrate = (channelData as VoiceChannelData).bitrate;
            createOptions.userLimit = (channelData as VoiceChannelData).userLimit;
            createOptions.type = 'voice';
        }
        guild.channels.create(channelData.name, createOptions).then(async channel => {
            /* Update channel permissions */
            const finalPermissions: OverwriteData[] = [];
            channelData.permissions.forEach(perm => {
                const role = guild.roles.find(r => r.name === perm.roleName);
                if (role) {
                    finalPermissions.push({
                        id: role.id,
                        allow: perm.allow,
                        deny: perm.deny
                    });
                }
            });
            await channel.overwritePermissions({
                // Update category permissions
                permissionOverwrites: finalPermissions
            });
            /* Load messages */
            if (channelData.type === 'text') {
                (channel as TextChannel)
                    .createWebhook('MessagesBackup', {
                        avatar: channel.client.user.displayAvatarURL()
                    })
                    .then(async webhook => {
                        const messages = (channelData as TextChannelData).messages
                            .filter(m => m.content.length > 0)
                            .reverse();
                        for (const msg of messages) {
                            webhook.send(msg.content, {
                                username: msg.username,
                                avatarURL: msg.avatar
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

/**
 * Delete all roles, all channels, all emojis, etc... of a guild
 * @param {Guild} guild
 * @returns {Promise<void>}
 */
export async function clearGuild(guild: Guild) {
    guild.roles
        .filter(role => !role.managed && role.editable && role.id !== guild.id)
        .forEach(role => {
            role.delete().catch(() => {});
        });
    guild.channels.forEach(channel => {
        channel.delete().catch(() => {});
    });
    guild.emojis.forEach(emoji => {
        emoji.delete().catch(() => {});
    });
    const webhooks = await guild.fetchWebhooks();
    webhooks.forEach(webhook => {
        webhook.delete().catch(() => {});
    });
    const bans = await guild.fetchBans();
    bans.forEach(ban => {
        guild.members.unban(ban.user).catch(err => {});
    });
    return;
}
