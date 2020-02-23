import { ChannelPermissionsData } from './';
export interface BaseChannelData {
    type: string;
    name: string;
    parent?: string;
    permissions: ChannelPermissionsData[];
}
