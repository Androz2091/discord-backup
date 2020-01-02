import { BaseChannelData } from './BaseChannelData';

export interface VoiceChannelData extends BaseChannelData {
    bitrate: number;
    userLimit: number;
}
