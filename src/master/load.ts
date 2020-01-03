import { Guild } from 'discord.js';
import { BackupData } from '../types';
import { loadCategory, loadChannel } from './util';

/**
 * Restores the guild configuration
 * @param {Guild} guild The discord guild
 * @param {BackupData} backupData The backup data
 * @returns {Promise<void>}
 */
export async function conf(guild: Guild, backupData: BackupData) {
    if (backupData.name) {
        guild.setName(backupData.name);
    }
    if (backupData.iconURL) {
        guild.setIcon(backupData.iconURL);
    } else if (backupData.iconBase64) {
        guild.setIcon(new Buffer(backupData.iconBase64, 'base64'));
    }
    if (backupData.splashURL) {
        guild.setSplash(backupData.splashURL);
    } else if (backupData.splashBase64) {
        guild.setSplash(new Buffer(backupData.splashBase64, 'base64'));
    }
    if (backupData.bannerURL) {
        guild.setIcon(backupData.bannerURL);
    } else if (backupData.bannerBase64) {
        guild.setIcon(new Buffer(backupData.bannerBase64, 'base64'));
    }
    if (backupData.region) {
        guild.setRegion(backupData.region);
    }
    if (backupData.verificationLevel) {
        guild.setVerificationLevel(backupData.verificationLevel);
    }
    if (backupData.defaultMessageNotifications) {
        guild.setDefaultMessageNotifications(backupData.defaultMessageNotifications);
    }
    if (backupData.explicitContentFilter) {
        guild.setExplicitContentFilter(backupData.explicitContentFilter);
    }
    return;
}

/**
 * Restore the guild roles
 * @param {Guild} guild The discord guild
 * @param {BackupData} backupData The backup data
 * @returns {Promise<void>}
 */
export async function roles(guild: Guild, backupData: BackupData) {
    backupData.roles.forEach(roleData => {
        guild.roles.create({
            // Create the role
            data: {
                name: roleData.name,
                color: roleData.color,
                hoist: roleData.hoist,
                permissions: roleData.permissions,
                mentionable: roleData.mentionable
            }
        });
    });
    return;
}

/**
 * Restore the guild channels
 * @param {Guild} guild The discord guild
 * @param {BackupData} backupData The backup data
 * @returns {Promise<void>}
 */
export async function channels(guild: Guild, backupData: BackupData) {
    backupData.channels.categories.forEach(categoryData => {
        loadCategory(categoryData, guild).then(createdCategory => {
            categoryData.children.forEach(channelData => {
                loadChannel(channelData, guild, createdCategory);
            });
        });
    });
    return;
}

/**
 * Restore the afk configuration
 * @param {Guild} guild The discord guild
 * @param {BackupData} backupData The backup data
 */
export async function afk(guild: Guild, backupData: BackupData) {
    if (backupData.afk) {
        guild.setAFKChannel(guild.channels.find(ch => ch.name === backupData.afk.name));
        guild.setAFKTimeout(backupData.afk.timeout);
    }
    return;
}

/**
 * Restore guild emojis
 * @param {Guild} guild The discord guild
 * @param {BackupData} backupData The backup data
 * @returns {Promise<void>}
 */
export async function emojis(guild: Guild, backupData: BackupData) {
    backupData.emojis.forEach(emoji => {
        if (emoji.url) {
            guild.emojis.create(emoji.url, emoji.name);
        } else if (emoji.base64) {
            guild.emojis.create(new Buffer(emoji.base64, 'base64'), emoji.name);
        }
    });
    return;
}

/**
 * Restore guild bans
 * @param {Guild} guild The discord guild
 * @param {BackupData} backupData The backup data
 */
export async function bans(guild: Guild, backupData: BackupData) {
    backupData.bans.forEach(ban => {
        guild.members.ban(ban.id, {
            reason: ban.reason
        });
    });
    return;
}

/**
 * Restore embedChannel configuration
 * @param {Guild} guild The discord guild
 * @param {BackupData} backupData The backup data
 * @returns {Promise<void>}
 */
export async function embedChannel(guild: Guild, backupData: BackupData) {
    if (backupData.embed.channel) {
        guild.setEmbed({
            enabled: backupData.embed.enabled,
            channel: guild.channels.find(ch => ch.name === backupData.embed.channel)
        });
    }
    return;
}
