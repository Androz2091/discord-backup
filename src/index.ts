import type { BackupData, BackupInfos, CreateOptions, LoadOptions } from './types/';
import type { Guild } from 'discord.js';
import { SnowflakeUtil } from 'discord.js';

import nodeFetch from 'node-fetch';
import { sep } from 'path';

import { existsSync, mkdirSync, readdir, statSync, unlinkSync, writeFile } from 'fs';
import { promisify } from 'util';
const writeFileAsync = promisify(writeFile);
const readdirAsync = promisify(readdir);

import * as createMaster from './create';
import * as loadMaster from './load';
import * as utilMaster from './util';
import { RateLimitManager } from './ratelimit';

let backups = `${__dirname}/backups`;
if (!existsSync(backups)) {
    mkdirSync(backups);
}

/**
 * Checks if a backup exists and returns its data
 */
const getBackupData = async (backupID: string) => {
    return new Promise<BackupData>(async (resolve, reject) => {
        const files = await readdirAsync(backups); // Read "backups" directory
        // Try to get the json file
        const file = files.filter((f) => f.split('.').pop() === 'json').find((f) => f === `${backupID}.json`);
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
export const fetch = (backupID: string) => {
    return new Promise<BackupInfos>(async (resolve, reject) => {
        getBackupData(backupID)
            .then((backupData) => {
                const size = statSync(`${backups}${sep}${backupID}.json`).size; // Gets the size of the file using fs
                const backupInfos: BackupInfos = {
                    data: backupData,
                    id: backupID,
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
        backupID: null,
        maxMessagesPerChannel: 10,
        jsonSave: true,
        jsonBeautify: true,
        doNotBackup: [],
        saveImages: ''
    }
) => {
    return new Promise<BackupData>(async (resolve, reject) => {
        try {
            const backupData: BackupData = {
                name: guild.name,
                region: guild.region,
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
                guildID: guild.id,
                id: options.backupID ?? SnowflakeUtil.generate(Date.now())
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
                await writeFileAsync(`${backups}${sep}${backupData.id}.json`, backupJSON, 'utf-8');
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
        clearGuildBeforeRestore: true,
        maxMessagesPerChannel: 10,
        mode: 'auto', // Select mode for Rate Limit
    },
) => {
    return new Promise(async (resolve, reject) => {
        if (!guild) {
            return reject('Invalid guild');
        }
        try {
            const backupData: BackupData = typeof backup === 'string' ? await getBackupData(backup) : backup;
            // Parse mode
            if (
                typeof options.mode != 'string' &&
                typeof options.mode != 'number'
            ) throw new Error('Bad options, mode must be string or number');

            const rateLimitManager = new RateLimitManager(
                50,
                10000,
                typeof options.mode == 'string' ?
                    options.mode == 'slow' ? 1500 : options.mode == 'fast' ? 250 : 750
                    : 750
            );
            
            try {
                if (options.clearGuildBeforeRestore === undefined || options.clearGuildBeforeRestore) {
                    // Clear the guild
                    await utilMaster.clearGuild(guild, rateLimitManager);
                }

                await Promise.all([
                    // Restore guild configuration
                    loadMaster.loadConfig(guild, backupData, rateLimitManager),
                    // Restore guild roles
                    loadMaster.loadRoles(guild, backupData, rateLimitManager),
                    // Restore guild channels
                    loadMaster.loadChannels(guild, backupData, rateLimitManager, options),
                    // Restore afk channel and timeout
                    loadMaster.loadAFK(guild, backupData, rateLimitManager),
                    // Restore guild emojis
                    loadMaster.loadEmojis(guild, backupData, rateLimitManager),
                    // Restore guild bans
                    loadMaster.loadBans(guild, backupData, rateLimitManager),
                    // Restore embed channel
                    loadMaster.loadEmbedChannel(guild, backupData, rateLimitManager)
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
export const remove = async (backupID: string) => {
    return new Promise<void>((resolve, reject) => {
        try {
            require(`${backups}${sep}${backupID}.json`);
            unlinkSync(`${backups}${sep}${backupID}.json`);
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
    const files = await readdirAsync(backups); // Read "backups" directory
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
