import { WebhookMessageOptions } from 'discord.js';

export interface LoadOptions {
    clearGuildBeforeRestore: boolean;
    maxMessagesPerChannel?: number;
    disableWebhookMention?: 'none' | 'all' | 'everyone';
}
