import {
    CategoryChannel,
    ChannelLogsQueryOptions,
    Collection,
    Guild,
    GuildCreateChannelOptions,
    Message,
    OverwriteData,
    Snowflake,
    TextChannel,
    VoiceChannel
} from 'discord.js';
import {
    CategoryData,
    ChannelPermissionsData,
    CreateOptions,
    LoadOptions,
    TextChannelData,
    VoiceChannelData
} from '../types';

/**
 * Gets the permissions for a channel
 */
export function fetchChannelPermissions(channel: TextChannel | VoiceChannel | CategoryChannel) {
    const permissions: ChannelPermissionsData[] = [];
    channel.permissionOverwrites
        .filter(p => p.type === 'role')
        .forEach(perm => {
            // For each overwrites permission
            const role = channel.guild.roles.cache.get(perm.id);
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
 */
export async function fetchTextChannelData(channel: TextChannel, options: CreateOptions) {
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
        /* Fetch channel messages */
        const messageCount: number = isNaN(options.maxMessagesPerChannel) ? 10 : options.maxMessagesPerChannel;
        const fetchOptions: ChannelLogsQueryOptions = { limit: 100 };
        let lastMessageId: Snowflake;
        let fetchComplete: boolean = false;
        try {
            while (!fetchComplete) {
                if (lastMessageId) {
                    fetchOptions.before = lastMessageId;
                }
                const fetched: Collection<Snowflake, Message> = await channel.messages.fetch(fetchOptions);
                if (fetched.size === 0) {
                    break;
                }
                lastMessageId = fetched.last().id;
                fetched.forEach(msg => {
                    if (!msg.author || channelData.messages.length >= messageCount) {
                        fetchComplete = true;
                        return;
                    }
                    channelData.messages.push({
                        username: msg.author.username,
                        avatar: msg.author.displayAvatarURL(),
                        content: msg.cleanContent
                    });
                });
            }
            /* Return channel data */
            resolve(channelData);
        } catch {
            resolve(channelData);
        }
    });
}

/**
 * Creates a category for the guild
 */
export async function loadCategory(categoryData: CategoryData, guild: Guild) {
    return new Promise<CategoryChannel>(resolve => {
        guild.channels.create(categoryData.name, { type: 'category' }).then(async category => {
            // When the category is created
            const finalPermissions: OverwriteData[] = [];
            categoryData.permissions.forEach(perm => {
                const role = guild.roles.cache.find(r => r.name === perm.roleName);
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
 */
export async function loadChannel(
    channelData: TextChannelData | VoiceChannelData,
    guild: Guild,
    category?: CategoryChannel,
    options?: LoadOptions
) {
    return new Promise(async resolve => {
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
                const role = guild.roles.cache.find(r => r.name === perm.roleName);
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
                        let i = 0;
                        for (const msg of messages) {
                            if (i === options.maxMessagesPerChannel) {
                                break;
                            }
                            webhook.send(msg.content, {
                                username: msg.username,
                                avatarURL: msg.avatar
                            });
                            i++;
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
 */
export async function clearGuild(guild: Guild) {
    guild.roles.cache
        .filter(role => !role.managed && role.editable && role.id !== guild.id)
        .forEach(role => {
            role.delete().catch(() => {});
        });
    guild.channels.cache.forEach(channel => {
        channel.delete().catch(() => {});
    });
    guild.emojis.cache.forEach(emoji => {
        emoji.delete().catch(() => {});
    });
    const webhooks = await guild.fetchWebhooks();
    webhooks.forEach(webhook => {
        webhook.delete().catch(() => {});
    });
    const bans = await guild.fetchBans();
    bans.forEach(ban => {
        guild.members.unban(ban.user).catch(() => {});
    });
    const integrations = await guild.fetchIntegrations();
    integrations.forEach(integration => {
        integration.delete();
    });
    guild.setAFKChannel(null);
    guild.setAFKTimeout(60 * 5);
    guild.setIcon(null);
    guild.setBanner(null).catch(() => {});
    guild.setSplash(null).catch(() => {});
    guild.setDefaultMessageNotifications('MENTIONS');
    guild.setEmbed({
        enabled: false,
        channel: null
    });
    guild.setExplicitContentFilter(0);
    guild.setSystemChannel(null);
    guild.setSystemChannelFlags(['WELCOME_MESSAGE_DISABLED', 'BOOST_MESSAGE_DISABLED']);
    guild.setVerificationLevel(0);
    return;
}
