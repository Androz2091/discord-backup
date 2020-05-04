import { MessageEmbed } from "discord.js";

export interface MessageData {
    username: string;
    avatar?: string;
    content?: string;
    embeds?: MessageEmbed[]
    pinned?: boolean;
}
