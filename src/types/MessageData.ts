import { Embed, RawFile } from 'discord.js';
export interface MessageData {
    username: string;
    avatar?: string;
    content?: string;
    embeds?: Embed[];
    files?: RawFile[];
    pinned?: boolean;
    sentAt: string;
}
