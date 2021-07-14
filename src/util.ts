import type {
    CategoryData,
    ChannelPermissionsData,
    CreateOptions,
    LoadOptions,
    TextChannelData,
    VoiceChannelData
} from './types';
import {
    CategoryChannel,
    ChannelLogsQueryOptions,
    Collection,
    Guild,
    GuildChannelCreateOptions,
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
    channel.permissionOverwrites.cache
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
            type: 'GUILD_VOICE',
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
            type: 'GUILD_TEXT',
            name: channel.name,
            nsfw: channel.nsfw,
            rateLimitPerUser: channel.type === 'GUILD_TEXT' ? channel.rateLimitPerUser : undefined,
            parent: channel.parent ? channel.parent.name : null,
            topic: channel.topic,
            permissions: fetchChannelPermissions(channel),
            messages: [],
            isNews: channel.type === 'GUILD_NEWS'
        };
        /* Fetch channel messages */
        const messageCount: number = isNaN(options.maxMessagesPerChannel) ? 10 : options.maxMessagesPerChannel;
        const fetchOptions: ChannelLogsQueryOptions = { limit: messageCount > 100 ? 100 : messageCount };
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
                let current: number = 0;
                await Promise.all(
                    fetched.map(async (msg) => {
                        current++;
                        if (!msg.author || current + 1 > messageCount) {
                            fetchComplete = true;
                        }
                        const files = await Promise.all(
                            msg.attachments.map(async (a) => {
                                let attach = a.url;
                                if (a.url && ['png', 'jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi'].includes(a.url)) {
                                    if (options.saveImages && options.saveImages === 'base64') {
                                        attach = (await nodeFetch(a.url).then((res) => res.buffer())).toString(
                                            'base64'
                                        );
                                    }
                                }
                                return {
                                    name: a.name,
                                    attachment: attach
                                };
                            })
                        );
                        channelData.messages.push({
                            username: msg.author.username,
                            avatar: msg.author.displayAvatarURL(),
                            content: msg.cleanContent,
                            embeds: msg.embeds,
                            files,
                            pinned: msg.pinned
                        });
                    })
                );
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
        guild.channels.create(categoryData.name, { type: 'GUILD_CATEGORY' }).then(async (category) => {
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
            await category.permissionOverwrites.set(finalPermissions);
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
        const createOptions: GuildChannelCreateOptions = {
            type: null,
            parent: category
        };
        if (channelData.type === 'GUILD_TEXT') {
            createOptions.topic = (channelData as TextChannelData).topic;
            createOptions.nsfw = (channelData as TextChannelData).nsfw;
            createOptions.rateLimitPerUser = (channelData as TextChannelData).rateLimitPerUser;
            createOptions.type =
                (channelData as TextChannelData).isNews && guild.features.includes('NEWS')
                    ? 'GUILD_NEWS'
                    : 'GUILD_TEXT';
        } else if (channelData.type === 'GUILD_VOICE') {
            // Downgrade bitrate
            const maxBitrate = {
                NONE: 64000,
                TIER_1: 128000,
                TIER_2: 256000,
                TIER_3: 384000
            };

            const bitrates = [64000, 128000, 256000, 384000];

            let bitrate = (channelData as VoiceChannelData).bitrate;
            while (bitrate > maxBitrate[guild.premiumTier]) {
                bitrate = bitrates[bitrates.indexOf(maxBitrate[guild.premiumTier]) - 1];
            }
            createOptions.bitrate = bitrate;
            createOptions.userLimit = (channelData as VoiceChannelData).userLimit;
            createOptions.type = 'GUILD_VOICE';
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
            await channel.permissionOverwrites.set(finalPermissions);
            /* Load messages */
            if (channelData.type === 'GUILD_TEXT' && (channelData as TextChannelData).messages.length > 0) {
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
                                .send({
                                    content: msg.content || undefined,
                                    username: msg.username,
                                    avatarURL: msg.avatar,
                                    embeds: msg.embeds,
                                    files: msg.files,
                                    allowedMentions: options.allowedWebhookMentions
                                })
                                .catch((err) => {
                                    console.log(err.message);
                                });
                            if (msg.pinned && sentMsg && sentMsg instanceof Message) await sentMsg.pin();
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
export async function clearGuild(guild: Guild, doNotRestore: string[] = []) {
    if (!doNotRestore.includes('roles'))
        guild.roles.cache
            .filter((role) => !role.managed && role.editable && role.id !== guild.id)
            .forEach((role) => {
                role.delete().catch(() => {});
            });
    if (!doNotRestore.includes('channels'))
        guild.channels.cache.forEach((channel) => {
            channel.delete().catch(() => {});
        });
    if (!doNotRestore.includes('emojis'))
        guild.emojis.cache.forEach((emoji) => {
            emoji.delete().catch(() => {});
        });
    const webhooks = await guild.fetchWebhooks();
    if (!doNotRestore.includes('webhooks'))
        webhooks.forEach((webhook) => {
            webhook.delete().catch(() => {});
        });
    const bans = await guild.bans.fetch();
    if (!doNotRestore.includes('bans'))
        bans.forEach((ban) => {
            guild.members.unban(ban.user).catch(() => {});
        });
    guild.setAFKChannel(null);
    guild.setAFKTimeout(60 * 5);
    guild.setIcon(null);
    guild.setBanner(null).catch(() => {});
    guild.setSplash(null).catch(() => {});
    guild.setDefaultMessageNotifications('ONLY_MENTIONS');
    guild.setWidget({
        enabled: false,
        channel: null
    });
    if (!guild.features.includes('COMMUNITY')) {
        guild.setExplicitContentFilter('DISABLED');
        guild.setVerificationLevel('NONE');
    }
    guild.setSystemChannel(null);
    guild.setSystemChannelFlags(7);
    return;
}
