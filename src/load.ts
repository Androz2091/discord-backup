import type { BackupData, LoadOptions } from './types';
import type { NewsChannel, TextChannel, ForumChannel, VoiceBasedChannel } from 'discord.js';
import { ChannelType, Emoji, Guild, GuildFeature, Role, VoiceChannel } from 'discord.js';
import { loadCategory, loadChannel } from './util';

/**
 * Restores the guild configuration
 */
export const loadConfig = (guild: Guild, backupData: BackupData): Promise<Guild[]> => {
    const configPromises: Promise<Guild>[] = [];
    if (backupData.name) {
        configPromises.push(guild.setName(backupData.name));
    }
    if (backupData.iconBase64) {
        configPromises.push(guild.setIcon(Buffer.from(backupData.iconBase64, 'base64')));
    } else if (backupData.iconURL) {
        configPromises.push(guild.setIcon(backupData.iconURL));
    }
    if (backupData.splashBase64) {
        configPromises.push(guild.setSplash(Buffer.from(backupData.splashBase64, 'base64')));
    } else if (backupData.splashURL) {
        configPromises.push(guild.setSplash(backupData.splashURL));
    }
    if (backupData.bannerBase64) {
        configPromises.push(guild.setBanner(Buffer.from(backupData.bannerBase64, 'base64')));
    } else if (backupData.bannerURL) {
        configPromises.push(guild.setBanner(backupData.bannerURL));
    }
    if (backupData.verificationLevel) {
        configPromises.push(guild.setVerificationLevel(backupData.verificationLevel));
    }
    if (backupData.defaultMessageNotifications) {
        configPromises.push(guild.setDefaultMessageNotifications(backupData.defaultMessageNotifications));
    }
    const changeableExplicitLevel = guild.features.includes(GuildFeature.Community);
    if (backupData.explicitContentFilter && changeableExplicitLevel) {
        configPromises.push(guild.setExplicitContentFilter(backupData.explicitContentFilter));
    }
    return Promise.all(configPromises);
};

/**
 * Restore the guild roles
 */
export const loadRoles = async (guild: Guild, backupData: BackupData): Promise<Role[]> => {
    const roles: Role[] = [];

    for (const roleData of backupData.roles) {
        try {
            let role: Role;

            if (roleData.isEveryone) {
                const everyoneRole = guild.roles.cache.get(guild.id);
                if (everyoneRole) {
                    role = await everyoneRole.edit({
                        name: roleData.name,
                        color: roleData.color,
                        permissions: BigInt(roleData.permissions),
                        mentionable: roleData.mentionable
                    });
                    roles.push(role);
                }
            } else {
                role = await guild.roles.create({
                    name: roleData.name.slice(0, 100),
                    color: roleData.color,
                    hoist: roleData.hoist,
                    permissions: BigInt(roleData.permissions),
                    mentionable: roleData.mentionable
                });
                roles.push(role);
            }

            await new Promise((resolve) => setTimeout(resolve, 250));
        } catch (error: any) {
            // Failed to create/edit role - skipping
        }
    }

    return roles;
};

/**
 * Restore the guild channels
 */
export const loadChannels = (guild: Guild, backupData: BackupData, options: LoadOptions): Promise<unknown[]> => {
    const loadChannelPromises: Promise<void | unknown>[] = [];
    backupData.channels.categories.forEach((categoryData) => {
        loadChannelPromises.push(
            new Promise((resolve) => {
                loadCategory(categoryData, guild).then((createdCategory) => {
                    categoryData.children.forEach((channelData) => {
                        loadChannel(channelData, guild, createdCategory, options);
                        resolve(true);
                    });
                });
            })
        );
    });
    backupData.channels.others.forEach((channelData) => {
        loadChannelPromises.push(loadChannel(channelData, guild, null, options));
    });
    return Promise.all(loadChannelPromises);
};

/**
 * Restore the afk configuration
 */
export const loadAFK = (guild: Guild, backupData: BackupData): Promise<Guild[]> => {
    const afkPromises: Promise<Guild>[] = [];
    if (backupData.afk) {
        afkPromises.push(
            guild.setAFKChannel(
                guild.channels.cache.find(
                    (ch) => ch.name === backupData.afk.name && ch.type === ChannelType.GuildVoice
                ) as VoiceChannel
            )
        );
        afkPromises.push(guild.setAFKTimeout(backupData.afk.timeout));
    }
    return Promise.all(afkPromises);
};

/**
 * Restore guild emojis
 */
export const loadEmojis = async (guild: Guild, backupData: BackupData): Promise<Emoji[]> => {
    const emojis: Emoji[] = [];
    const maxEmojis =
        guild.premiumTier === 0 ? 50 : guild.premiumTier === 1 ? 100 : guild.premiumTier === 2 ? 150 : 250;

    for (let i = 0; i < Math.min(backupData.emojis.length, maxEmojis); i++) {
        const emojiData = backupData.emojis[i];
        try {
            let emoji: Emoji;

            if (emojiData.url) {
                emoji = await guild.emojis.create({
                    name: emojiData.name.slice(0, 32),
                    attachment: emojiData.url
                });
            } else if (emojiData.base64) {
                emoji = await guild.emojis.create({
                    name: emojiData.name.slice(0, 32),
                    attachment: Buffer.from(emojiData.base64, 'base64')
                });
            }

            if (emoji) {
                emojis.push(emoji);
            }

            await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error: any) {
            // Failed to create emoji - skipping
        }
    }

    return emojis;
};

/**
 * Restore guild bans
 */
export const loadBans = async (guild: Guild, backupData: BackupData): Promise<string[]> => {
    const bannedUsers: string[] = [];

    for (const banData of backupData.bans) {
        try {
            await guild.members.ban(banData.id, {
                reason: banData.reason || 'Restored from backup'
            });
            bannedUsers.push(banData.id);

            await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error: any) {
            // Failed to ban user - skipping
        }
    }

    return bannedUsers;
};

/**
 * Restore embedChannel configuration
 */
export const loadEmbedChannel = (guild: Guild, backupData: BackupData): Promise<Guild[]> => {
    const embedChannelPromises: Promise<Guild>[] = [];
    if (backupData.widget.channel) {
        embedChannelPromises.push(
            guild.setWidgetSettings({
                enabled: backupData.widget.enabled,
                channel: guild.channels.cache.find((ch) => ch.name === backupData.widget.channel) as
                    | NewsChannel
                    | TextChannel
                    | ForumChannel
                    | VoiceBasedChannel
            })
        );
    }
    return Promise.all(embedChannelPromises);
};
