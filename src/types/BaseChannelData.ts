import { TextBasedChannelTypes, VoiceBasedChannelTypes, ThreadChannelTypes } from 'discord.js';
import { ChannelPermissionsData } from './';

export interface BaseChannelData {
    type: TextBasedChannelTypes | VoiceBasedChannelTypes | ThreadChannelTypes;
    name: string;
    parent?: string;
    permissions: ChannelPermissionsData[];
}
