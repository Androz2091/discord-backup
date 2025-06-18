import { ChannelPermissionsData, TextChannelData, VoiceChannelData } from './';

export interface CategoryData {
    name: string;
    permissions: ChannelPermissionsData[];
    children: (TextChannelData | VoiceChannelData)[];
}
