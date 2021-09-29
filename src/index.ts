import type { BackupData, BackupInfos, CreateOptions, LoadOptions } from './types/';
import type { Guild } from 'discord.js';
import { SnowflakeUtil, Intents } from 'discord.js';

import nodeFetch from 'node-fetch';
import { sep } from 'path';

import { existsSync, mkdirSync, statSync, unlinkSync } from 'fs';
import { writeFile, readdir } from 'fs/promises';

import * as createMaster from './create';
import * as loadMaster from './load';
import * as clearMaster from './clear';
import * as utilMaster from './util';

let backups = `${__dirname}/backups`;
if (!existsSync(backups)) {
    mkdirSync(backups);
}

/**
 * Checks if a backup exists and returns its data
 */
const getBackupData = async (backupId: string) => {
    return new Promise<BackupData>(async (resolve, reject) => {
        const files = await readdir(backups); // Read "backups" directory
        // Try to get the json file
        const file = files.filter((f) => f.split('.').pop() === 'json').find((f) => f === `${backupId}.json`);
        if (file) {
            // If the file exists
            const backupData: BackupData = require(`${backups}${sep}${file}`);
            // Returns backup informations
            resolve(backupData);
        } else {
            // If no backup was found, return an error message
            reject('No backup found');
        }
    });
};

/**
 * Fetches a backyp and returns the information about it
 */
export const fetch = (backupId: string) => {
    return new Promise<BackupInfos>(async (resolve, reject) => {
        getBackupData(backupId)
            .then((backupData) => {
                const size = statSync(`${backups}${sep}${backupId}.json`).size; // Gets the size of the file using fs
                const backupInfos: BackupInfos = {
                    data: backupData,
                    id: backupId,
                    size: Number((size / 1024).toFixed(2))
                };
                // Returns backup informations
                resolve(backupInfos);
            })
            .catch(() => {
                reject('No backup found');
            });
    });
};

/**
 * Creates a new backup and saves it to the storage
 */
export const create = async (
    guild: Guild,
    options: CreateOptions = {
        backupId: null,
        maxMessagesPerChannel: 10,
        jsonSave: true,
        jsonBeautify: true,
        doNotBackup: [],
        saveImages: ''
    }
) => {
    return new Promise<BackupData>(async (resolve, reject) => {

       const intents = new Intents(guild.client.options.intents);
       if (!intents.has('GUILDS')) return reject('GUILDS intent is required');

        try {
            const backupData: BackupData = {
                name: guild.name,
                verificationLevel: guild.verificationLevel,
                explicitContentFilter: guild.explicitContentFilter,
                defaultMessageNotifications: guild.defaultMessageNotifications,
                afk: guild.afkChannel ? { name: guild.afkChannel.name, timeout: guild.afkTimeout } : null,
                widget: {
                    enabled: guild.widgetEnabled,
                    channel: guild.widgetChannel ? guild.widgetChannel.name : null
                },
                channels: { categories: [], others: [] },
                roles: [],
                bans: [],
                emojis: [],
                createdTimestamp: Date.now(),
                guildId: guild.id,
                id: options.backupId ?? SnowflakeUtil.generate(Date.now())
            };
            if (guild.iconURL()) {
                if (options && options.saveImages && options.saveImages === 'base64') {
                    backupData.iconBase64 = (
                        await nodeFetch(guild.iconURL({ dynamic: true })).then((res) => res.buffer())
                    ).toString('base64');
                }
                backupData.iconURL = guild.iconURL({ dynamic: true });
            }
            if (guild.splashURL()) {
                if (options && options.saveImages && options.saveImages === 'base64') {
                    backupData.splashBase64 = (await nodeFetch(guild.splashURL()).then((res) => res.buffer())).toString(
                        'base64'
                    );
                }
                backupData.splashURL = guild.splashURL();
            }
            if (guild.bannerURL()) {
                if (options && options.saveImages && options.saveImages === 'base64') {
                    backupData.bannerBase64 = (await nodeFetch(guild.bannerURL()).then((res) => res.buffer())).toString(
                        'base64'
                    );
                }
                backupData.bannerURL = guild.bannerURL();
            }
            if (!options || !(options.doNotBackup || []).includes('bans')) {
                // Backup bans
                backupData.bans = await createMaster.getBans(guild);
            }
            if (!options || !(options.doNotBackup || []).includes('roles')) {
                // Backup roles
                backupData.roles = await createMaster.getRoles(guild);
            }
            if (!options || !(options.doNotBackup || []).includes('emojis')) {
                // Backup emojis
                backupData.emojis = await createMaster.getEmojis(guild, options);
            }
            if (!options || !(options.doNotBackup || []).includes('channels')) {
                // Backup channels
                backupData.channels = await createMaster.getChannels(guild, options);
            }
            if (!options || options.jsonSave === undefined || options.jsonSave) {
                // Convert Object to JSON
                const backupJSON = options.jsonBeautify
                    ? JSON.stringify(backupData, null, 4)
                    : JSON.stringify(backupData);
                // Save the backup
                await writeFile(`${backups}${sep}${backupData.id}.json`, backupJSON, 'utf-8');
            }
            // Returns ID
            resolve(backupData);
        } catch (e) {
            return reject(e);
        }
    });
};

/**
 * Loads a backup for a guild
 */
export const load = async (
    backup: string | BackupData,
    guild: Guild,
    options: LoadOptions = {
        doNotClear: [],
        doNotRestore: [],
        maxMessagesPerChannel: 10
    }
) => {
    return new Promise(async (resolve, reject) => {
        if (!guild) {
            return reject('Invalid guild');
        }
        try {
            const backupData: BackupData = typeof backup === 'string' ? await getBackupData(backup) : backup;
            try {
                if (!options || !(options.doNotClear || []).includes('roles')) {
                // Clear guild roles
                    await clearMaster.clearRoles(guild);
                }
                if (!options || !(options.doNotClear || []).includes('channels')) {
                  // Clear guild channels
                  await clearMaster.clearChannels(guild);
                }
                if (!options || !(options.doNotClear || []).includes('emojis')) {
                  // Clear guild emojis
                  await clearMaster.clearEmojis(guild);
                }
                if (!options || !(options.doNotClear || []).includes('bans')) {
                  // Clear guild bans
                  await clearMaster.clearBans(guild);
                }

                await Promise.all([
                    // Clear guild configuration
                    clearMaster.clearConfig(guild),
                    // Clear guild webhooks
                    clearMaster.clearWebhooks(guild)
                ]);

                if (!options || !(options.doNotRestore || []).includes('roles')) {
                // Restore guild roles
                    await loadMaster.loadRoles(guild, backupData);
                }
                if (!options || !(options.doNotRestore || []).includes('channels')) {
                  // Restore guild channels
                  await clearMaster.loadChannels(guild, backupData);
                }
                if (!options || !(options.doNotRestore || []).includes('emojis')) {
                  // Restore guild emojis
                  await loadMaster.loadEmojis(guild, backupData);
                }
                if (!options || !(options.doNotRestore || []).includes('bans')) {
                  // Restore guild bans
                  await loadMaster.loadBans(guild, backupData);
                }

                await Promise.all([
                    // Restore guild configuration
                    loadMaster.loadConfig(guild, backupData),
                    // Restore afk channel and timeout
                    loadMaster.loadAFK(guild, backupData),
                    // Restore embed channel
                    loadMaster.loadEmbedChannel(guild, backupData)
                ]);
            } catch (e) {
                return reject(e);
            }
            // Then return the backup data
            return resolve(backupData);
        } catch (e) {
            return reject('No backup found');
        }
    });
};

/**
 * Removes a backup
 */
export const remove = async (backupId: string) => {
    return new Promise<void>((resolve, reject) => {
        try {
            require(`${backups}${sep}${backupId}.json`);
            unlinkSync(`${backups}${sep}${backupId}.json`);
            resolve();
        } catch (error) {
            reject('Backup not found');
        }
    });
};

/**
 * Returns the list of all backup
 */
export const list = async () => {
    const files = await readdir(backups); // Read "backups" directory
    return files.map((f) => f.split('.')[0]);
};

/**
 * Change the storage path
 */
export const setStorageFolder = (path: string) => {
    if (path.endsWith(sep)) {
        path = path.substr(0, path.length - 1);
    }
    backups = path;
    if (!existsSync(backups)) {
        mkdirSync(backups);
    }
};

export default {
    create,
    fetch,
    list,
    load,
    remove
};
