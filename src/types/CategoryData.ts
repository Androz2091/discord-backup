import { ChannelPermissionsData } from "./ChannelPermissionData";
import { TextChannelData } from "./TextChannelData";
import { VoiceChannelData } from "./VoiceChannelData";

export interface CategoryData {
    name: string;
    permissions: ChannelPermissionsData[];
    children: Array<TextChannelData|VoiceChannelData>;
}