/* To know more information about this npm module, go here : https://npmjs.com/package/discord-backup */

const
    util = require("util"),
    fs = require("fs"),
    readdir = promisify(require("fs").readdir);

module.exports = {

    version = require("./package.json").version,

    /**
     * This function fetches a backyp and returns the information about it
     * 
     * @param {string} backupID The ID of the backup to fetch
     * 
     * @returns An object, the backup informations
     */
    async fetch(backupID){
        return new Promise(async function(resolve, reject){
            let files = await readdir("./backups");
            let jsFiles = files.filter((f) => f.split(".").pop() === "js");
            let found = false;
            jsFiles.forEach(file => {
                if(file === backupID){
                    found = true;
                    let backupInformations = require("./backups/"+file+".js");
                    let size = fs.statSync("./backups/"+file+".js").size;
                    resolve({
                        ID:backupID,
                        guildID: backupInformations.guildID,
                        createdTimestamp: backupInformations.createdTimestamp,
                        size: (size/1024/1024).toFixed(2)+"MB"
                    });
                }
            });
            if(!found){
                reject("No backup found");
            }
        });
    }
}