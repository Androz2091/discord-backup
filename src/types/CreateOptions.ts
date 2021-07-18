export interface CreateOptions {
    backupID?: `${bigint}`;
    maxMessagesPerChannel?: number;
    jsonSave?: boolean;
    jsonBeautify?: boolean;
    doNotBackup?: ('roles' | 'channels' | 'emojis' | 'bans')[];
    saveImages?: string;
}
