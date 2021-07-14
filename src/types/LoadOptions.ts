export interface LoadOptions {
    clearGuildBeforeRestore: boolean;
    maxMessagesPerChannel?: number;
    allowedWebhookMentions?: Object;
    doNotRestore?: string[];
}
