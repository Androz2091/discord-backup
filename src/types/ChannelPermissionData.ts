import { Permissions } from 'discord.js';

export interface ChannelPermissionsData {
    roleName: string;
    allow: number;
    deny: number;
}
