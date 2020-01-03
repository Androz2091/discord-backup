import { BaseChannelData, MessageData } from './';

export interface TextChannelData extends BaseChannelData {
    nsfw: boolean;
    parent?: string;
    topic?: string;
    rateLimitPerUser: number;
    messages: MessageData[];
}
