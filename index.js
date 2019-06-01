/* To know more information about this npm module, go here : https://npmjs.com/package/discord-backup */

const util = require("util"),
fs = require("fs"),
readdir = util.promisify(require("fs").readdir),
randomstring = require("randomstring");

let backups = `${__dirname}/backups/`;

if(!fs.existsSync(backups)){
    fs.mkdirSync(backups);
}

const fBackup = require("./functions/backup"),
fLoad = require("./functions/load"),
utils = require("./functions/utils");

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
            getBackupInformations(backupID).then((backupInformations) => {
                let size = fs.statSync(`${backups}${backupID}.json`).size; // Gets the size of the file using fs
                // Returns backup informations
                resolve({
                    ID: backupID,
                    guildID: backupInformations.guildID,
                    createdTimestamp: backupInformations.createdTimestamp,
                    size: `${(size/1024/1024).toFixed(2)}MB`
                });
            }).catch((err) => {
                reject("No backup found");
            });
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
            createdTimestamp: Date.now(),
            guildID: guild.id
        };
        // Backup bans
        guildData.bans = await fBackup.getBans(guild);
        // Backup roles
        guildData.roles = await fBackup.getRoles(guild);
        // Backup emojis
        guildData.emojis = await fBackup.getEmojis(guild);
        // Backup channels
        guildData.channels = await fBackup.getChannels(guild);
        // Convert Object to JSON
        let backupJSON = JSON.stringify(guildData);
        // Create backup ID
        let backupID = randomstring.generate(5);
        // Save the backup
        fs.writeFileSync(`${backups}${backupID}.json`, backupJSON);
        // Returns ID
        return backupID;
    },

    /**
     * This function loads a backup for a guild
     * @param {string} backupID The ID of the backup to load
     * @param {object} guild The guild on which the backup will be loaded
     * @returns If the operation is successful
     */
    async load(backupID, guild){
        return new Promise(async function(resolve, reject){
            getBackupInformations(backupID).then(async (backupInformations) => {
                if(!guild){
                    return reject("Invalid guild");
                }
                // Clear the guild
                await utils.clearGuild(guild);
                // Restore guild configuration
                await fLoad.configuration(guild, backupInformations);
                // Restore guild roles
                await fLoad.roles(guild, backupInformations);
                // Restore guild channels
                await fLoad.channels(guild, backupInformations);
                // Restore afk channel and timeout
                await fLoad.afk(guild, backupInformations);
                // Restore guild emojis
                await fLoad.emojis(guild, backupInformations);
                // Restore guild bans
                await fLoad.bans(guild, backupInformations);
                // Restore embed channel
                await fLoad.embedChannel(guild, backupInformations);
                // Then return true
                return resolve(true);
            }).catch((err) => {
                // If no backup was found, return an error message
                return reject("No backup found");
            });
        });
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
    },

    /**
     * This function returns the list of all backup
     * @returns The list of the backups
     */
    async list(){
        let files = await readdir(backups); // Read "backups" directory
        return files.map((f) => f.substr(0, 5));
    }
};

async function getBackupInformations(backupID){
    return new Promise(async function(resolve, reject){
        let files = await readdir(backups); // Read "backups" directory
        // Try to get the Json file
        let file = files.filter((f) => f.split(".").pop() === "json").find((f) => f === `${backupID}.json`);
        if(file){ // If the file exists
            let backupInformations = require(`${backups}${file}`);
            // Returns backup informations
            resolve(backupInformations);
        } else {
            // If no backup was found, return an error message
            reject("No backup found");
        }
    });
}