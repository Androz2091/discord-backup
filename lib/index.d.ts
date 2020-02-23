import { Guild } from 'discord.js';
import { BackupData, BackupInfos, CreateOptions, LoadOptions } from './types/';
/**
 * Fetches a backyp and returns the information about it
 */
export declare const fetch: (backupID: string) => Promise<BackupInfos>;
/**
 * Creates a new backup and saves it to the storage
 */
export declare const create: (guild: Guild, options?: CreateOptions) => Promise<BackupData>;
/**
 * Loads a backup for a guild
 */
export declare const load: (backup: string | BackupData, guild: Guild, options?: LoadOptions) => Promise<unknown>;
/**
 * Removes a backup
 */
export declare const remove: (backupID: string) => Promise<void>;
/**
 * Returns the list of all backup
 */
export declare const list: () => Promise<string[]>;
/**
 * Change the storage path
 */
export declare const setStorageFolder: (path: string) => void;
declare const _default: {
    create: (guild: Guild, options?: CreateOptions) => Promise<BackupData>;
    fetch: (backupID: string) => Promise<BackupInfos>;
    list: () => Promise<string[]>;
    load: (backup: string | BackupData, guild: Guild, options?: LoadOptions) => Promise<unknown>;
    remove: (backupID: string) => Promise<void>;
};
export default _default;
