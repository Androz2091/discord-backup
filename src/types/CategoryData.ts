import { ChannelPermissionsData } from "./ChannelPermissionData";
import { TextChannelData } from "./TextChannelData";
import { VoiceChannelData } from "./VoiceChannelData";

export interface CategoryData {
    name: string;
    permissions: Array<ChannelPermissionsData>;
    children: Array<TextChannelData|VoiceChannelData>;
}