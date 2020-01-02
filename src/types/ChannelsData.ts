import { CategoryData } from "./CategoryData";
import { TextChannelData } from "./TextChannelData";
import { VoiceChannelData } from "./VoiceChannelData";

export interface ChannelsData {
    categories: Array<CategoryData>;
    others: Array<TextChannelData|VoiceChannelData>;
};