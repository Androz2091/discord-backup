import {
    GuildDefaultMessageNotifications,
    GuildExplicitContentFilter,
    Snowflake,
    GuildVerificationLevel
} from 'discord.js';
import { AfkData, BanData, ChannelsData, EmojiData, RoleData, WidgetData } from './';
import { MemberData } from './MemberData';

export interface BackupData {
    name: string;
    iconURL?: string;
    iconBase64?: string;
    verificationLevel: GuildVerificationLevel;
    explicitContentFilter: GuildExplicitContentFilter;
    defaultMessageNotifications: GuildDefaultMessageNotifications | number;
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
    members: MemberData[];
    createdTimestamp: number;
    guildID: string;
    id: Snowflake;
}
