import { DefaultMessageNotifications, RoleData, Snowflake } from "discord.js";
import { AfkData } from "./AfkData";
import { EmbedData } from "./EmbedData";
import { ChannelsData } from "./ChannelsData";
import { BanData } from "./BanData";
import { EmojiData } from "./EmojiData";

export interface BackupData {
    name: string;
    icon?: string;
    region: string;
    verificationLevel: number;
    explicitContentFilter: number;
    defaultMessageNotifications: DefaultMessageNotifications|number;
    afk?: AfkData;
    embed: EmbedData;
    splash?: string;
    banner?: string;
    channels: ChannelsData;
    roles: RoleData[];
    bans: BanData[];
    emojis: EmojiData[];
    createdTimestamp: number;
    guildID: string;
    id: Snowflake;
};