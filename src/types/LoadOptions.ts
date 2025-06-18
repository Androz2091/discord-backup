import { MessageMentionOptions } from 'discord.js';

export interface LoadOptions {
    clearGuildBeforeRestore: boolean;
    maxMessagesPerChannel?: number;
    allowedMentions?: MessageMentionOptions;
}
