import { ChannelPermissionsData } from './ChannelPermissionData';

export interface BaseChannelData {
    type: string;
    name: string;
    parent?: string;
    permissions: ChannelPermissionsData[];
}
