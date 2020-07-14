import { MessageEmbed, MessageAttachment } from "discord.js";

export interface MessageData {
    username: string;
    avatar?: string;
    content?: string;
    embeds?: MessageEmbed[]
    attachments?: MessageAttachment[];
    pinned?: boolean;
}
