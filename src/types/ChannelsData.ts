import { CategoryData } from './CategoryData';
import { TextChannelData } from './TextChannelData';
import { VoiceChannelData } from './VoiceChannelData';

export interface ChannelsData {
    categories: CategoryData[];
    others: Array<TextChannelData | VoiceChannelData>;
}
