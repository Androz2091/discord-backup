import { Snowflake } from 'discord.js';

export interface BanData {
    id: Snowflake;
    reason: string;
}
