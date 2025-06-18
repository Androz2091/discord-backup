import { CategoryData, TextChannelData, VoiceChannelData } from './';

export interface ChannelsData {
    categories: CategoryData[];
    others: (TextChannelData | VoiceChannelData)[];
}
