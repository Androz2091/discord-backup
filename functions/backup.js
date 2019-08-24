let utils = require("./utils");

module.exports = {

    /**
     * Returns an array with the banned members of the guild
     * @param {object} guild The Discord guild
     * @returns The banned members 
     */
    async getBans(guild){
        let bans = [];
        let cases = await guild.fetchBans(); // Gets the list of the banned members
        cases.forEach((ban) => { // For each ban
            bans.push({
                id: ban.user.id, // The Id of the banned member
                reason: ban.reason // The reason of the ban
            });
        });
        return bans;
    },

    /**
     * Returns an array with the roles of the guild
     * @param {object} guild The discord guild
     * @returns The roles of the guild
     */
    async getRoles(guild){
        let roles = [];
        guild.roles.forEach((role) => { // For each role of the guild
            if(role.id !== guild.roles.everyone.id){ // If the role is not @everyone
                let rData = {
                    name: role.name,
                    color: role.hexColor,
                    hoist: role.hoist,
                    permissions: role.permissions.bitfield,
                    mentionable:role.mentionable,
                    position:role.position
                };
                roles.push(rData);
            }
        });
        return roles;
    },

    /**
     * Returns an array with the emojis of the guild
     * @param {object} guild The discord guild
     * @returns The emojis of the guild
     */
    async getEmojis(guild){
        let emojis = [];
        guild.emojis.forEach((emoji) => {
            let eData = {
                name: emoji.name,
                url: emoji.url
            };
            emojis.push(eData);
        });
        return emojis;
    },

    /**
     * Returns an array with the channels of the guild
     * @param {object} guild The discord guild
     * @returns The channels of the guild
     */
    async getChannels(guild){
        return new Promise(async function(resolve, reject){
            let channels = {
                categories:[],
                others:[]
            };
            // Gets the list of the categories and sort them by position
            let categories = guild.channels.filter((ch) => ch.type === "category").sort((a,b) => a.position-b.position);
            for(let category of categories){ // For each category
                let categoryData = {
                    name: category[1].name, // The name of the category
                    permissionOverwrites: utils.fetchOverwritesPermission(category[1]), // The overwrite permissions of the category
                    children: [] // The children channels of the category
                };
                // Gets the children channels of the category and sort them by position
                let children = category[1].children.sort((a,b) => a.position-b.position);
                for(let child of children){ // For each child channel
                    let channelData = await utils.fetchChannelData(child[1]); // Gets the channel data
                    categoryData.children.push(channelData); // And then push the child in the categoryData
                }
                channels.categories.push(categoryData); // Update channels object
            }
            // Gets the list of the other channels (that are not in a category) and sort them by position
            let others = guild.channels.filter((ch) => !ch.parent && ch.type !== "category").sort((a,b) => a.position-b.position);
            for(let channel of others){ // For each channel
                let channelData = await utils.fetchChannelData(channel[1]); // Gets the channel data
                channels.others.push(channelData); // Update channels object
            }
            resolve(channels); // Returns the list of the channels
        });
    }
};