import { DefaultMessageNotifications, RoleData, Snowflake } from 'discord.js';
import { AfkData, BanData, ChannelsData, EmbedData, EmojiData } from './';
export interface BackupData {
    name: string;
    iconURL?: string;
    iconBase64?: string;
    region: string;
    verificationLevel: number;
    explicitContentFilter: number;
    defaultMessageNotifications: DefaultMessageNotifications | number;
    afk?: AfkData;
    embed: EmbedData;
    splashURL?: string;
    splashBase64?: string;
    bannerURL?: string;
    bannerBase64?: string;
    channels: ChannelsData;
    roles: RoleData[];
    bans: BanData[];
    emojis: EmojiData[];
    createdTimestamp: number;
    guildID: string;
    id: Snowflake;
}
