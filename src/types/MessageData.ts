import { MessageEmbed, FileOptions } from "discord.js";

export interface MessageData {
    username: string;
    avatar?: string;
    content?: string;
    embeds?: MessageEmbed[]
    files?: FileOptions[];
    pinned?: boolean;
}
