export interface CreateOptions {
    backupID?: `${bigint}`;
    maxMessagesPerChannel?: number;
    jsonSave?: boolean;
    jsonBeautify?: boolean;
    doNotBackup?: string[];
    saveImages?: string;
}
