import { Guild, SnowflakeUtil, version as djsVersion } from 'discord.js';
const master: boolean = djsVersion.split('.')[0] === '12';

import axios from 'axios';
import { sep } from 'path';

import { existsSync, mkdirSync, readdir, statSync, unlinkSync, writeFile } from 'fs';
import { promisify } from 'util';
const writeFileAsync = promisify(writeFile);
const readdirAsync = promisify(readdir);

import { BackupData, BackupInfos, CreateOptions, LoadOptions } from './types/';

import * as createStable from './stable/create';
import * as loadStable from './stable/load';
import * as utilStable from './stable/util';

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
        const file = files.filter(f => f.split('.').pop() === 'json').find(f => f === `${backupID}.json`);
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
            .then(backupData => {
                const size = statSync(`${backups}${sep}${backupID}.json`).size; // Gets the size of the file using fs
                const backupInfos: BackupInfos = {
                    data: backupData,
                    id: backupID,
                    size: Number((size / 1024 / 1024).toFixed(2))
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
export const create = async (guild: Guild, options?: CreateOptions) => {
    return new Promise<BackupData>(async (resolve, reject) => {
        if (!master) {
            try {
                const backupData: BackupData = {
                    name: guild.name,
                    region: guild.region,
                    verificationLevel: guild.verificationLevel,
                    explicitContentFilter: guild.explicitContentFilter,
                    defaultMessageNotifications: guild.defaultMessageNotifications,
                    afk: guild.afkChannel ? { name: guild.afkChannel.name, timeout: guild.afkTimeout } : null,
                    embed: {
                        enabled: guild.embedEnabled,
                        channel: guild.embedChannel ? guild.embedChannel.name : null
                    },
                    channels: { categories: [], others: [] },
                    roles: [],
                    bans: [],
                    emojis: [],
                    createdTimestamp: Date.now(),
                    guildID: guild.id,
                    id: SnowflakeUtil.generate(Date.now())
                };
                if (guild.iconURL) {
                    if (options && options.saveImages && options.saveImages === 'base64') {
                        const res = await axios.get(guild.iconURL, { responseType: 'arraybuffer' });
                        backupData.iconBase64 = Buffer.from(res.data, 'binary').toString('base64');
                    }
                    backupData.iconURL = guild.iconURL;
                }
                if (guild.splashURL) {
                    if (options && options.saveImages && options.saveImages === 'base64') {
                        const res = await axios.get(guild.splashURL, { responseType: 'arraybuffer' });
                        backupData.splashBase64 = Buffer.from(res.data, 'binary').toString('base64');
                    }
                    backupData.splashURL = guild.splashURL;
                }
                if (guild.bannerURL) {
                    if (options && options.saveImages && options.saveImages === 'base64') {
                        const res = await axios.get(guild.bannerURL, { responseType: 'arraybuffer' });
                        backupData.bannerBase64 = Buffer.from(res.data, 'binary').toString('base64');
                    }
                    backupData.bannerURL = guild.bannerURL;
                }
                if (!options || !(options.doNotBackup || []).includes('bans')) {
                    // Backup bans
                    backupData.bans = await createStable.getBans(guild);
                }
                if (!options || !(options.doNotBackup || []).includes('roles')) {
                    // Backup roles
                    backupData.roles = await createStable.getRoles(guild);
                }
                if (!options || !(options.doNotBackup || []).includes('emojis')) {
                    // Backup emojis
                    backupData.emojis = await createStable.getEmojis(guild, options);
                }
                if (!options || !(options.doNotBackup || []).includes('channels')) {
                    // Backup channels
                    backupData.channels = await createStable.getChannels(guild, options);
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
        } else {
            reject(
                "Only 11.5-dev branch of discord.js library is supported by this discord-backup version. Install the one for the master branch with 'npm install discord-backup'."
            );
        }
    });
};

/**
 * Loads a backup for a guild
 */
export const load = async (backup: string | BackupData, guild: Guild, options?: LoadOptions) => {
    return new Promise(async (resolve, reject) => {
        if (!guild) {
            return reject('Invalid guild');
        }
        try {
            const backupData: BackupData = typeof backup === 'string' ? await getBackupData(backup) : backup;
            if (!master) {
                try {
                    if (!options || options.clearGuildBeforeRestore === undefined || options.clearGuildBeforeRestore) {
                        // Clear the guild
                        await utilStable.clearGuild(guild);
                    }
                    // Restore guild configuration
                    await loadStable.conf(guild, backupData);
                    // Restore guild roles
                    await loadStable.roles(guild, backupData);
                    // Restore guild channels
                    await loadStable.channels(guild, backupData);
                    // Restore afk channel and timeout
                    await loadStable.afk(guild, backupData);
                    // Restore guild emojis
                    await loadStable.emojis(guild, backupData);
                    // Restore guild bans
                    await loadStable.bans(guild, backupData);
                    // Restore embed channel
                    await loadStable.embedChannel(guild, backupData);
                } catch (e) {
                    return reject(e);
                }
                // Then return the backup data
                return resolve(backupData);
            } else {
                reject(
                    "Only 11.5-dev branch of discord.js library is supported by this discord-backup version. Install the one for the master branch with 'npm install discord-backup'."
                );
            }
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
    return files.map(f => f.split('.')[0]);
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
