import { APIEmbed } from 'discord.js';

export interface MessageData {
    username: string;
    avatar?: string;
    content?: string;
    embeds?: APIEmbed[];
    files?: {
        name: string;
        attachment: string;
    }[];
    pinned?: boolean;
    sentAt: string;
}
