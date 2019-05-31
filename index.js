/* To know more information about this npm module, go here : https://npmjs.com/package/discord-backup */

const util = require("util"),
fs = require("fs"),
readdir = util.promisify(require("fs").readdir);

let backups = `${__dirname}/backups/`;

if(!fs.existsSync(backups)){
    fs.mkdirSync(backups);
}

module.exports = {

    version: require("./package.json").version,

    /**
     * This function fetches a backyp and returns the information about it
     * 
     * @param {string} backupID The ID of the backup to fetch
     * 
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
    }
}