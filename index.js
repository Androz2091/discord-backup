/* To know more information about this npm module, go here : https://npmjs.com/package/discord-backup */

const util = require("util"),
fs = require("fs"),
readdir = util.promisify(require("fs").readdir),
randomstring = require("randomstring");

let backups = `${__dirname}/backups/`;

if(!fs.existsSync(backups)){
    fs.mkdirSync(backups);
}

const backup = require("./backup");

module.exports = {

    /* Returns the package version */
    version: require("./package.json").version,

    /**
     * This function fetches a backyp and returns the information about it
     * @param {string} backupID The ID of the backup to fetch
     * @returns An object, the backup informations
     */
    async fetch(backupID){
        return new Promise(async function(resolve, reject){
            let files = await readdir(backups); // Read "backups" directory
            // Try to get the Json file
            let file = files.filter((f) => f.split(".").pop() === "json").find((f) => f === `${backupID}.json`);
            if(file){ // If the file exists
                let backupInformations = require(`${backups}${file}`);
                let size = fs.statSync(`${backups}${file}`).size; // Gets the size of the file using fs
                // Returns backup informations
                resolve({
                    ID: backupID,
                    guildID: backupInformations.guildID,
                    createdTimestamp: backupInformations.createdTimestamp,
                    size: `${(size/1024/1024).toFixed(2)}MB`
                });
            } else {
                // If no backup was found, return an error message
                reject("No backup found");
            }
        });
    },

    /**
     * This function creates a backup for a discord server
     * @param {object} guild The guild to backup
     * @returns The backup ID
     */
    async create(guild){

        let guildData = {
            name: guild.name,
            icon: guild.iconURL(),
            region: guild.region,
            verificationLevel: guild.verificationLevel,
            explicitContentFilter: guild.explicitContentFilter,
            defaultMessageNotifications: guild.defaultMessageNotifications,
            AFK: (guild.afkChannel ? {
                name: guild.afkChannel.name,
                timeout: guild.afkTimeout
            } : false),
            embed:{
                enabled: guild.embedEnabled,
                channel: (guild.embedChannel ? guild.embedChannel.name : false)
            },
            splash: guild.splashURL(),
            banner: guild.banner,
            channels:{
                categories:[],
                others:[]
            },
            roles:[],
            bans:[],
            emojis:[],
            createdAt: Date.now(),
            guildID: guild.id
        }

        // Backup bans
        guildData.bans = await backup.getBans(guild);

        // Backup roles
        guildData.roles = await backup.getRoles(guild);

        // Backup emojis
        guildData.emojis = await backup.getEmojis(guild);

        // Backup channels
        guildData.channels = await backup.getChannels(guild);

        // Convert Object to JSON
        var backupJSON = JSON.stringify(guildData);

        // Create backup ID
        var backupID = randomstring.generate(5);

        // Save the backup
        fs.writeFileSync(`${backups}${backupID}.json`, backupJSON);

        // Returns ID
        return backupID;

    },

    /**
     * This function deletes a backup
     * @param {string} backupID The ID of the backup to delete
     * @returns If the operation is successful
     */
    async delete(backupID){
        let filePath = `${backups}${backupID}.json`;
        try {
            fs.unlinkSync(filePath);
            return true;
        } catch(error){
            return error;
        }
    }
};