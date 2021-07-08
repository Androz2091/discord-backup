export interface LoadOptions {
    clearGuildBeforeRestore: boolean;
    maxMessagesPerChannel?: number;
    disableWebhookMentions?: 'none' | 'all' | 'everyone';
}
