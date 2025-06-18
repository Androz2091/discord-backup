import type {
    CategoryData,
    ChannelPermissionsData,
    CreateOptions,
    LoadOptions,
    MessageData,
    TextChannelData,
    ThreadChannelData,
    VoiceChannelData
} from './types';
import {
    CategoryChannel,
    ChannelType,
    Collection,
    Guild,
    GuildFeature,
    GuildDefaultMessageNotifications,
    GuildSystemChannelFlags,
    GuildChannelCreateOptions,
    Message,
    OverwriteData,
    Snowflake,
    TextChannel,
    VoiceChannel,
    NewsChannel,
    ThreadChannel,
    Webhook,
    GuildPremiumTier,
    GuildExplicitContentFilter,
    GuildVerificationLevel,
    FetchMessagesOptions,
    OverwriteType,
    AttachmentBuilder
} from 'discord.js';
import nodeFetch from 'node-fetch';

const MaxBitratePerTier: Record<GuildPremiumTier, number> = {
    [GuildPremiumTier.None]: 64000,
    [GuildPremiumTier.Tier1]: 128000,
    [GuildPremiumTier.Tier2]: 256000,
    [GuildPremiumTier.Tier3]: 384000
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry<T>(operation: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 1000): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            if (attempt === maxRetries) {
                throw error;
            }

            const delayMs = baseDelay * Math.pow(2, attempt - 1);

            if (error?.code === 50013) {
                throw error;
            }

            if (error?.code === 50035 || error?.code === 50001) {
                throw error;
            }

            if (error?.status === 429) {
                const retryAfter = error?.retryAfter ? error.retryAfter * 1000 : delayMs;
                // Rate limited - waiting before retry
                await delay(retryAfter);
                continue;
            }

            // Operation failed - retrying
            await delay(delayMs);
        }
    }

    throw new Error('Max retries exceeded');
}

/**
 * Gets the permissions for a channel
 */
export function fetchChannelPermissions(channel: TextChannel | VoiceChannel | CategoryChannel | NewsChannel) {
    const permissions: ChannelPermissionsData[] = [];
    channel.permissionOverwrites.cache
        .filter((p) => p.type === OverwriteType.Role)
        .forEach((perm) => {
            // For each overwrites permission
            const role = channel.guild.roles.cache.get(perm.id);
            if (role) {
                permissions.push({
                    roleName: role.name,
                    allow: perm.allow.bitfield.toString(),
                    deny: perm.deny.bitfield.toString()
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
            type: ChannelType.GuildVoice,
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

export async function fetchChannelMessages(
    channel: TextChannel | NewsChannel | ThreadChannel,
    options: CreateOptions
): Promise<MessageData[]> {
    const messages: MessageData[] = [];
    const messageCount: number = isNaN(options.maxMessagesPerChannel)
        ? 10
        : Math.min(options.maxMessagesPerChannel, 1000);
    const fetchOptions: FetchMessagesOptions = { limit: Math.min(100, messageCount) };
    let lastMessageId: Snowflake;
    let fetchComplete: boolean = false;

    while (!fetchComplete && messages.length < messageCount) {
        try {
            if (lastMessageId) {
                fetchOptions.before = lastMessageId;
            }

            const fetched: Collection<Snowflake, Message> = await withRetry(
                () => channel.messages.fetch(fetchOptions),
                3,
                1000
            );

            if (fetched.size === 0) {
                break;
            }

            lastMessageId = fetched.last().id;

            for (const msg of fetched.values()) {
                if (!msg.author || messages.length >= messageCount) {
                    fetchComplete = true;
                    break;
                }

                try {
                    const files = await Promise.all(
                        msg.attachments.map(async (a) => {
                            let attach = a.url;
                            const fileExt = a.url.split('.').pop()?.toLowerCase();
                            if (
                                a.url &&
                                fileExt &&
                                ['png', 'jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi', 'gif', 'webp'].includes(fileExt)
                            ) {
                                if (options.saveImages && options.saveImages === 'base64') {
                                    try {
                                        const response = await withRetry(() => nodeFetch(a.url), 2, 500);
                                        const buffer = await response.buffer();
                                        if (buffer.length <= 8 * 1024 * 1024) {
                                            attach = buffer.toString('base64');
                                        }
                                    } catch (error: any) {
                                        // Failed to fetch attachment - using URL instead
                                    }
                                }
                            }
                            return {
                                name: a.name,
                                attachment: attach
                            };
                        })
                    );

                    messages.push({
                        username: msg.author.username,
                        avatar: msg.author.displayAvatarURL(),
                        content: msg.cleanContent || '',
                        embeds: msg.embeds.slice(0, 10).map((embed) => ({
                            title: embed.title,
                            description: embed.description,
                            url: embed.url,
                            color: embed.color,
                            timestamp: embed.timestamp,
                            fields: embed.fields?.slice(0, 25),
                            author: embed.author,
                            footer: embed.footer,
                            thumbnail: embed.thumbnail,
                            image: embed.image
                        })),
                        files,
                        pinned: msg.pinned,
                        sentAt: msg.createdAt.toISOString()
                    });
                } catch (error: any) {
                    // Failed to process message - skipping
                }
            }

            await delay(100);
        } catch (error: any) {
            // Failed to fetch messages - stopping
            break;
        }
    }

    return messages;
}

/**
 * Fetches the text channel data that is necessary for the backup
 */
export async function fetchTextChannelData(channel: TextChannel | NewsChannel, options: CreateOptions) {
    return new Promise<TextChannelData>(async (resolve) => {
        const channelData: TextChannelData = {
            type: channel.type,
            name: channel.name,
            nsfw: channel.nsfw,
            rateLimitPerUser: channel.type === ChannelType.GuildText ? channel.rateLimitPerUser : undefined,
            parent: channel.parent ? channel.parent.name : null,
            topic: channel.topic,
            permissions: fetchChannelPermissions(channel),
            messages: [],
            isNews: channel.type === ChannelType.GuildAnnouncement,
            threads: []
        };
        /* Fetch channel threads */
        if (channel.threads.cache.size > 0) {
            await Promise.all(
                channel.threads.cache.map(async (thread) => {
                    const threadData: ThreadChannelData = {
                        type: thread.type,
                        name: thread.name,
                        archived: thread.archived,
                        autoArchiveDuration: thread.autoArchiveDuration,
                        locked: thread.locked,
                        rateLimitPerUser: thread.rateLimitPerUser,
                        messages: []
                    };
                    try {
                        threadData.messages = await fetchChannelMessages(thread, options);
                        /* Return thread data */
                        channelData.threads.push(threadData);
                    } catch {
                        channelData.threads.push(threadData);
                    }
                })
            );
        }
        /* Fetch channel messages */
        try {
            channelData.messages = await fetchChannelMessages(channel, options);

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
    return withRetry(
        async () => {
            const category = await guild.channels.create({
                name: categoryData.name,
                type: ChannelType.GuildCategory
            });

            const finalPermissions: OverwriteData[] = [];
            categoryData.permissions.forEach((perm) => {
                const role = guild.roles.cache.find((r) => r.name === perm.roleName);
                if (role) {
                    finalPermissions.push({
                        id: role.id,
                        allow: BigInt(perm.allow),
                        deny: BigInt(perm.deny)
                    });
                }
            });

            if (finalPermissions.length > 0) {
                await withRetry(() => category.permissionOverwrites.set(finalPermissions));
            }

            return category;
        },
        3,
        2000
    );
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
        const loadMessages = async (
            channel: TextChannel | ThreadChannel,
            messages: MessageData[],
            previousWebhook?: Webhook
        ): Promise<Webhook | void> => {
            try {
                const webhook =
                    previousWebhook ||
                    (await withRetry(
                        () =>
                            (channel as TextChannel).createWebhook({
                                name: 'MessagesBackup',
                                avatar: channel.client.user.displayAvatarURL()
                            }),
                        2,
                        1000
                    ).catch((): null => null));

                if (!webhook) return;

                const filteredMessages = messages
                    .filter((m) => m.content?.length > 0 || m.embeds?.length > 0 || m.files?.length > 0)
                    .reverse()
                    .slice(0, options?.maxMessagesPerChannel || 10);

                for (let i = 0; i < filteredMessages.length; i++) {
                    const msg = filteredMessages[i];
                    try {
                        const files =
                            msg.files
                                ?.map((f): AttachmentBuilder | null => {
                                    try {
                                        return new AttachmentBuilder(f.attachment, { name: f.name });
                                    } catch {
                                        return null;
                                    }
                                })
                                .filter((f): f is AttachmentBuilder => f !== null) || [];

                        const sentMsg = await withRetry(
                            (): Promise<Message> =>
                                webhook.send({
                                    content: msg.content?.length ? msg.content.slice(0, 2000) : undefined,
                                    username: msg.username?.slice(0, 80) || 'Unknown User',
                                    avatarURL: msg.avatar,
                                    embeds: msg.embeds?.slice(0, 10) || [],
                                    files: files.slice(0, 10),
                                    allowedMentions: options?.allowedMentions || { parse: [] },
                                    threadId: channel.isThread() ? channel.id : undefined
                                }),
                            2,
                            500
                        ).catch((error: any): null => {
                            // Failed to send message
                            return null;
                        });

                        if (msg.pinned && sentMsg) {
                            await withRetry((): Promise<Message> => (sentMsg as Message).pin(), 1, 1000).catch(
                                () => {}
                            );
                        }

                        if (i < filteredMessages.length - 1) {
                            await delay(1000);
                        }
                    } catch (error: any) {
                        // Failed to process message
                    }
                }
                return webhook;
            } catch (error: any) {
                // Failed to load messages
                return;
            }
        };

        const createOptions: GuildChannelCreateOptions = {
            name: channelData.name,
            type: null,
            parent: category
        };
        if (channelData.type === ChannelType.GuildText || channelData.type === ChannelType.GuildAnnouncement) {
            createOptions.topic = (channelData as TextChannelData).topic;
            createOptions.nsfw = (channelData as TextChannelData).nsfw;
            createOptions.rateLimitPerUser = (channelData as TextChannelData).rateLimitPerUser;
            createOptions.type =
                (channelData as TextChannelData).isNews && guild.features.includes(GuildFeature.News)
                    ? ChannelType.GuildAnnouncement
                    : ChannelType.GuildText;
        } else if (channelData.type === ChannelType.GuildVoice) {
            // Downgrade bitrate
            let bitrate = (channelData as VoiceChannelData).bitrate;
            const bitrates = Object.values(MaxBitratePerTier);
            while (bitrate > MaxBitratePerTier[guild.premiumTier]) {
                bitrate = bitrates[guild.premiumTier];
            }
            createOptions.bitrate = bitrate;
            createOptions.userLimit = (channelData as VoiceChannelData).userLimit;
            createOptions.type = ChannelType.GuildVoice;
        }
        guild.channels.create(createOptions).then(async (channel) => {
            /* Update channel permissions */
            const finalPermissions: OverwriteData[] = [];
            channelData.permissions.forEach((perm) => {
                const role = guild.roles.cache.find((r) => r.name === perm.roleName);
                if (role) {
                    finalPermissions.push({
                        id: role.id,
                        allow: BigInt(perm.allow),
                        deny: BigInt(perm.deny)
                    });
                }
            });
            await channel.permissionOverwrites.set(finalPermissions);
            if (channelData.type === ChannelType.GuildText) {
                /* Load messages */
                let webhook: Webhook | void;
                if ((channelData as TextChannelData).messages.length > 0) {
                    webhook = await loadMessages(
                        channel as TextChannel,
                        (channelData as TextChannelData).messages
                    ).catch(() => {});
                }
                /* Load threads */
                if ((channelData as TextChannelData).threads.length > 0) {
                    // && guild.features.includes('THREADS_ENABLED')) {
                    await Promise.all(
                        (channelData as TextChannelData).threads.map(async (threadData) => {
                            const autoArchiveDuration = threadData.autoArchiveDuration;
                            // if (!guild.features.includes('SEVEN_DAY_THREAD_ARCHIVE') && autoArchiveDuration === 10080) autoArchiveDuration = 4320;
                            // if (!guild.features.includes('THREE_DAY_THREAD_ARCHIVE') && autoArchiveDuration === 4320) autoArchiveDuration = 1440;
                            return (channel as TextChannel).threads
                                .create({
                                    name: threadData.name,
                                    autoArchiveDuration
                                })
                                .then((thread) => {
                                    if (!webhook) return;
                                    return loadMessages(thread, threadData.messages, webhook);
                                });
                        })
                    );
                }
                return channel;
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
    const bans = await guild.bans.fetch();
    bans.forEach((ban) => {
        guild.members.unban(ban.user).catch(() => {});
    });
    guild.setAFKChannel(null);
    guild.setAFKTimeout(60 * 5);
    guild.setIcon(null);
    guild.setBanner(null).catch(() => {});
    guild.setSplash(null).catch(() => {});
    guild.setDefaultMessageNotifications(GuildDefaultMessageNotifications.OnlyMentions);
    guild.setWidgetSettings({
        enabled: false,
        channel: null
    });
    if (!guild.features.includes(GuildFeature.Community)) {
        guild.setExplicitContentFilter(GuildExplicitContentFilter.Disabled);
        guild.setVerificationLevel(GuildVerificationLevel.None);
    }
    guild.setSystemChannel(null);
    guild.setSystemChannelFlags([
        GuildSystemChannelFlags.SuppressGuildReminderNotifications,
        GuildSystemChannelFlags.SuppressJoinNotifications,
        GuildSystemChannelFlags.SuppressPremiumSubscriptions
    ]);
    return;
}
