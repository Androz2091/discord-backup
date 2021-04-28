import type {
    CategoryData,
    ChannelPermissionsData,
    CreateOptions,
    LoadOptions,
    TextChannelData,
    VoiceChannelData
} from './types';
import type {
    CategoryChannel,
    ChannelLogsQueryOptions,
    Collection,
    Guild,
    GuildCreateChannelOptions,
    Message,
    OverwriteData,
    Snowflake,
    TextChannel,
    VoiceChannel,
    NewsChannel
} from 'discord.js';
import nodeFetch from 'node-fetch';

/**
 * Gets the permissions for a channel
 */
export function fetchChannelPermissions(channel: TextChannel | VoiceChannel | CategoryChannel | NewsChannel) {
    const permissions: ChannelPermissionsData[] = [];
    channel.permissionOverwrites
        .filter((p) => p.type === 'role')
        .forEach((perm) => {
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
    return new Promise<VoiceChannelData>(async (resolve) => {
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
export async function fetchTextChannelData(channel: TextChannel | NewsChannel, options: CreateOptions) {
    return new Promise<TextChannelData>(async (resolve) => {
        const channelData: TextChannelData = {
            type: 'text',
            name: channel.name,
            nsfw: channel.nsfw,
            rateLimitPerUser: channel.type === 'text' ? channel.rateLimitPerUser : undefined,
            parent: channel.parent ? channel.parent.name : null,
            topic: channel.topic,
            permissions: fetchChannelPermissions(channel),
            messages: [],
            isNews: channel.type === 'news'
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
                await Promise.all(fetched.map(async (msg) => {
                    if (!msg.author || channelData.messages.length >= messageCount) {
                        fetchComplete = true;
                        return;
                    }
                    const files = await Promise.all(msg.attachments.map(async (a) => {
                        let attach = a.url
                        if (a.url && ['png', 'jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi'].includes(a.url)) {
                            if (options.saveImages && options.saveImages === 'base64') {
                                attach = (await (nodeFetch(a.url).then((res) => res.buffer()))).toString('base64')
                            }
                        }
                        return {
                            name: a.name,
                            attachment: attach
                        };
                    }))
                    channelData.messages.push({
                        username: msg.author.username,
                        avatar: msg.author.displayAvatarURL(),
                        content: msg.cleanContent,
                        embeds: msg.embeds,
                        files,
                        pinned: msg.pinned
                    });
                }));
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
    return new Promise<CategoryChannel>((resolve) => {
        guild.channels.create(categoryData.name, { type: 'category' }).then(async (category) => {
            // When the category is created
            const finalPermissions: OverwriteData[] = [];
            categoryData.permissions.forEach((perm) => {
                const role = guild.roles.cache.find((r) => r.name === perm.roleName);
                if (role) {
                    finalPermissions.push({
                        id: role.id,
                        allow: perm.allow,
                        deny: perm.deny
                    });
                }
            });
            await category.overwritePermissions(finalPermissions);
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
    return new Promise(async (resolve) => {
        const createOptions: GuildCreateChannelOptions = {
            type: null,
            parent: category
        };
        if (channelData.type === 'text') {
            createOptions.topic = (channelData as TextChannelData).topic;
            createOptions.nsfw = (channelData as TextChannelData).nsfw;
            createOptions.rateLimitPerUser = (channelData as TextChannelData).rateLimitPerUser;
            createOptions.type =
                (channelData as TextChannelData).isNews && guild.features.includes('NEWS') ? 'news' : 'text';
        } else if (channelData.type === 'voice') {
            // Downgrade bitrate
            const maxBitrate = [64000, 128000, 256000, 384000];
            let bitrate = (channelData as VoiceChannelData).bitrate;
            while (bitrate > maxBitrate[guild.premiumTier]) {
                bitrate = maxBitrate[maxBitrate.indexOf(guild.premiumTier) - 1];
            }
            createOptions.bitrate = bitrate;
            createOptions.userLimit = (channelData as VoiceChannelData).userLimit;
            createOptions.type = 'voice';
        }
        guild.channels.create(channelData.name, createOptions).then(async (channel) => {
            /* Update channel permissions */
            const finalPermissions: OverwriteData[] = [];
            channelData.permissions.forEach((perm) => {
                const role = guild.roles.cache.find((r) => r.name === perm.roleName);
                if (role) {
                    finalPermissions.push({
                        id: role.id,
                        allow: perm.allow,
                        deny: perm.deny
                    });
                }
            });
            await channel.overwritePermissions(finalPermissions);
            /* Load messages */
            if (channelData.type === 'text' && (channelData as TextChannelData).messages.length > 0) {
                (channel as TextChannel)
                    .createWebhook('MessagesBackup', {
                        avatar: channel.client.user.displayAvatarURL()
                    })
                    .then(async (webhook) => {
                        let messages = (channelData as TextChannelData).messages
                            .filter((m) => m.content.length > 0 || m.embeds.length > 0 || m.files.length > 0)
                            .reverse();
                        messages = messages.slice(messages.length - options.maxMessagesPerChannel);
                        for (const msg of messages) {
                            const sentMsg = await webhook
                                .send(msg.content, {
                                    username: msg.username,
                                    avatarURL: msg.avatar,
                                    embeds: msg.embeds,
                                    files: msg.files,
                                    disableMentions: options.disableWebhookMentions
                                })
                                .catch((err) => {
                                    console.log(err.message);
                                });
                            if (msg.pinned && sentMsg) await sentMsg.pin();
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
        .filter((role) => !role.managed && role.editable && role.id !== guild.id)
        .forEach((role) => {
            role.delete().catch(() => {});
        });
    guild.channels.cache.forEach((channel) => {
        channel.delete().catch(() => {});
    });
    guild.emojis.cache.forEach((emoji) => {
        emoji.delete().catch(() => {});
    });
    const webhooks = await guild.fetchWebhooks();
    webhooks.forEach((webhook) => {
        webhook.delete().catch(() => {});
    });
    const bans = await guild.fetchBans();
    bans.forEach((ban) => {
        guild.members.unban(ban.user).catch(() => {});
    });
    const integrations = await guild.fetchIntegrations();
    integrations.forEach((integration) => {
        integration.delete();
    });
    guild.setAFKChannel(null);
    guild.setAFKTimeout(60 * 5);
    guild.setIcon(null);
    guild.setBanner(null).catch(() => {});
    guild.setSplash(null).catch(() => {});
    guild.setDefaultMessageNotifications('MENTIONS');
    guild.setWidget({
        enabled: false,
        channel: null
    });
    if (!guild.features.includes('COMMUNITY')) {
        guild.setExplicitContentFilter('DISABLED');
        guild.setVerificationLevel('NONE');
    }
    guild.setSystemChannel(null);
    guild.setSystemChannelFlags(['WELCOME_MESSAGE_DISABLED', 'BOOST_MESSAGE_DISABLED']);
    return;
}
