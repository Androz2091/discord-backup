import { Guild } from 'discord.js';
import { BackupData, LoadOptions } from '../types';
/**
 * Restores the guild configuration
 */
export declare function conf(guild: Guild, backupData: BackupData): Promise<void>;
/**
 * Restore the guild roles
 */
export declare function roles(guild: Guild, backupData: BackupData): Promise<void>;
/**
 * Restore the guild channels
 */
export declare function channels(guild: Guild, backupData: BackupData, options?: LoadOptions): Promise<void>;
/**
 * Restore the afk configuration
 */
export declare function afk(guild: Guild, backupData: BackupData): Promise<void>;
/**
 * Restore guild emojis
 */
export declare function emojis(guild: Guild, backupData: BackupData): Promise<void>;
/**
 * Restore guild bans
 */
export declare function bans(guild: Guild, backupData: BackupData): Promise<void>;
/**
 * Restore embedChannel configuration
 */
export declare function embedChannel(guild: Guild, backupData: BackupData): Promise<void>;
