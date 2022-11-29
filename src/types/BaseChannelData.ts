import { TextBasedChannelTypes, VoiceBasedChannelTypes, ThreadChannelType } from 'discord.js';
import { ChannelPermissionsData } from './';

export interface BaseChannelData {
    type: TextBasedChannelTypes | VoiceBasedChannelTypes | ThreadChannelType;
    name: string;
    parent?: string;
    permissions: ChannelPermissionsData[];
}
