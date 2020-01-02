import { BanData, CategoryData, ChannelsData, EmojiData, RoleData, TextChannelData, VoiceChannelData} from '../types';
import { fetchChannelPermissions, fetchTextChannelData, fetchVoiceChannelData } from './util';
import { Guild, TextChannel, VoiceChannel, CategoryChannel } from 'discord.js';

/**
 * Returns an array with the banned members of the guild
 * @param {Guild} guild The Discord guild
 * @returns {Promise<BanData[]>} The banned members 
 */
export async function getBans(guild: Guild){
    const bans: BanData[] = [];
    const cases = await guild.fetchBans(); // Gets the list of the banned members
    cases.forEach((ban) => {
        bans.push({
            id: ban.user.id, // Banned member ID
            reason: ban.reason // Ban reason
        });
    });
    return bans;
}

/**
 * Returns an array with the roles of the guild
 * @param {Guild} guild The discord guild
 * @returns {Promise<RoleData[]>} The roles of the guild
 */
export async function getRoles(guild: Guild){
    const roles: RoleData[] = [];
    guild.roles.forEach((role) => {
        if(role.id !== (guild.roles.everyone ? guild.roles.everyone.id : '')){ // If the role is not @everyone
            const roleData = {
                name: role.name,
                color: role.hexColor,
                hoist: role.hoist,
                permissions: role.permissions.bitfield,
                mentionable: role.mentionable,
                position: role.position
            };
            roles.push(roleData);
        }
    });
    return roles;
}

/**
 * Returns an array with the emojis of the guild
 * @param {Guild} guild The discord guild
 * @returns {Promise<EmojiData[]>} The emojis of the guild
 */
export async function getEmojis(guild: Guild){
    let emojis: EmojiData[] = [];
    guild.emojis.forEach((emoji) => {
        let eData = {
            name: emoji.name,
            url: emoji.url
        };
        emojis.push(eData);
    });
    return emojis;
}

/**
 * Returns an array with the channels of the guild
 * @param {Guild} guild The discord guild
 * @returns {ChannelData[]} The channels of the guild
 */
export async function getChannels(guild: Guild){
    return new Promise<ChannelsData>(async function(resolve){
        const channels: ChannelsData = {
            categories: [],
            others: []
        };
        // Gets the list of the categories and sort them by position
        const categories = guild.channels.filter((ch) => ch.type === 'category').sort((a, b) => a.position - b.position).array() as CategoryChannel[];
        for(let category of categories){
            let categoryData: CategoryData = {
                name: category.name, // The name of the category
                permissions: fetchChannelPermissions(category), // The overwrite permissions of the category
                children: [] // The children channels of the category
            };
            // Gets the children channels of the category and sort them by position
            let children = category.children.sort((a, b) => a.position - b.position).array();
            for(let child of children){ // For each child channel
                if(child.type === 'text'){
                    let channelData: TextChannelData = await fetchTextChannelData((child as TextChannel)); // Gets the channel data
                    categoryData.children.push(channelData); // And then push the child in the categoryData
                } else {
                    let channelData: VoiceChannelData = await fetchVoiceChannelData((child as VoiceChannel)); // Gets the channel data
                    categoryData.children.push(channelData); // And then push the child in the categoryData
                }
            }
            channels.categories.push(categoryData); // Update channels object
        }
        // Gets the list of the other channels (that are not in a category) and sort them by position
        let others = guild.channels.filter((ch) => !ch.parent && ch.type !== 'category').sort((a, b) => a.position - b.position).array();
        for(let channel of others){ // For each channel
            if(channel.type === 'text'){
                let channelData: TextChannelData = await fetchTextChannelData((channel as TextChannel)); // Gets the channel data
                channels.others.push(channelData); // Update channels object
            } else {
                let channelData: VoiceChannelData = await fetchVoiceChannelData((channel as VoiceChannel)); // Gets the channel data
                channels.others.push(channelData); // Update channels object
            }
        }
        resolve(channels); // Returns the list of the channels
    });
}