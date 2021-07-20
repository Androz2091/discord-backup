export interface LoadOptions {
    clearGuildBeforeRestore: boolean;
    maxMessagesPerChannel?: number;
    allowedWebhookMentions?: Object;
    doNotRestore?: ('roles' | 'channels' | 'emojis' | 'webhooks' | 'bans')[];
}
