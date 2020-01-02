import { BaseChannelData } from './BaseChannelData';
import { MessageData } from './MessageData';

export interface TextChannelData extends BaseChannelData {
    nsfw: boolean;
    parent?: string;
    topic?: string;
    rateLimitPerUser: number;
    messages: MessageData[];
}
