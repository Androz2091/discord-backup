import {
    DefaultMessageNotifications,
    ExplicitContentFilterLevel,
    RoleData,
    Snowflake,
    VerificationLevel
} from 'discord.js';
import { AfkData, BanData, ChannelsData, EmojiData, WidgetData } from './';

export interface BackupData {
    name: string;
    iconURL?: string;
    iconBase64?: string;
    region: string;
    verificationLevel: VerificationLevel;
    explicitContentFilter: ExplicitContentFilterLevel;
    defaultMessageNotifications: DefaultMessageNotifications | number;
    afk?: AfkData;
    widget: WidgetData;
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
