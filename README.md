# Discord Backup

**Note**: this module uses recent discordjs features and requires discord.js version 12.

Discord Backup is a powerful [Node.js](https://nodejs.org) module that allows you to easily manage discord server backups.

*   Unlimited backups!
*   Backup creation takes less than 10 seconds!
*   Even restores messages with webhooks!
*   And restores everything that is possible to restore (channels, roles, permissions, bans, emojis, name, icon, and more!)

## Installation

```js
npm install --save discord-backup
```

## Functions

### Create

Create a backup for the server specified in the parameters!

```js
/**
 * @param {object} [Guild] - The discord server you want to backup
 */

var backup = require("discord-backup");
backup.create(Guild).then((backupID) => {
    console.log(backupID); // NSJH2
});
```

### Load

Allows you to load a backup on a Discord server!

```js
/**
 * @param {string} [backupID] - The ID of the backup that you want to load
 * @param {object} [Guild] - The discord server on which you want to load the backup
 */

var backup = require("discord-backup");
backup.load(backupID, Guild).then(() => {
    backup.delete(backupID); // When the backup is loaded, it's recommended to delete it
});
```

### Fetch

Fetches information from a backup

```js
/**
 * @param {string} [backupID] - The ID of the backup to fetch
 */

var backup = require("discord-backup");
backup.fetch(backupID).then((backupInfos) => {
    console.log(backupInfos);
    /*
    {
        ID: "BC5qo",
        guildID: "573098923984551952",
        createdTimestamp: 1559329309168,
        size: "0.05MB",
        data: {backupData}
    }
    */
});
```

### Delete

**Warn**: once the backup is deleted, it is impossible to recover it!

```js
/**
 * @param {string} [backupID] - The ID of the backup to delete
 */

var backup = require("discord-backup");
backup.delete(backupID);
```

### List

**Note**: `backup#list()` simply returns an array of IDs, you must fetch the ID to get complete information.

```js
var backup = require("discord-backup");
backup.list().then((backups) => {
    console.log(backups); // Expected Output [ "BC5qo", "Jdo91", ...]
});
```

## Example Bot

```js
// Load modules
const Discord = require("discord.js"),
backup = require("discord-backup"),
client = new Discord.Client(),
settings = {
    prefix: "b!",
    token: "YOURTOKEN"
};

client.on("ready", () => {
    console.log("I'm ready !");
});

client.on("message", async message => {

    // This reads the first part of your message behind your prefix to see which command you want to use.
    let command = message.content.toLowerCase().slice(settings.prefix.length).split(" ")[0];

    // These are the arguments behind the commands.
    let args = message.content.split(' ').slice(1);

    // If the message does not start with your prefix return.
    // If the user that types a message is a bot account return.
    // If the command comes from DM return.
    if (!message.content.startsWith(settings.prefix) || message.author.bot || !message.guild) return;

    if(command === "create"){
        // Check member permissions
        if(!message.member.hasPermission("ADMINISTRATOR")){
            return message.channel.send(":x: | You must be an administrator of this server to request a backup!");
        }
        // Create the backup
        backup.create(message.guild).then((backupID) => {
            // And send informations to the backup owner
            message.author.send("The backup has been created! To load it, type this command on the server of your choice: `"+settings.prefix+"load "+backupID+"`!");
        });
    }

    if(command === "load"){
        // Check member permissions
        if(!message.member.hasPermission("ADMINISTRATOR")){
            return message.channel.send(":x: | You must be an administrator of this server to load a backup!");
        }
        let backupID = args[0];
        if(!backupID){
            return message.channel.send(":x: | You must specify a valid backup ID!");
        }
        // Fetching the backup to know if it exists
        backup.fetch(backupID).then(async () => {
            // If the backup exists, request for confirmation
            message.channel.send(":warning: | When the backup is loaded, all the channels, roles, etc. will be replaced! Type `-confirm` to confirm!");
                await message.channel.awaitMessages(m => (m.author.id === message.author.id) && (m.content === "-confirm"), {
                    max: 1,
                    time: 20000,
                    errors: ["time"]
                }).catch((err) => {
                    // if the author of the commands does not confirm the backup loading
                    return message.channel.send(":x: | Time's up! Cancelled backup loading!");
                });
                // When the author of the command has confirmed that he wants to load the backup on his server
                message.author.send(":white_check_mark: | Start loading the backup!");
                // Load the backup
                backup.load(backupID, message.guild).then(() => {
                    // When the backup is loaded, delete them from the server
                    backup.delete(backupID);
                }).catch((err) => {
                    // If an error occurenced
                    return message.author.send(":x: | Sorry, an error occurenced... Please check that I have administrator permissions!");
                });
        }).catch((err) => {
            // if the backup wasn't found
            return message.channel.send(":x: | No backup found for `"+backupID+"`!");
        });
    }

    if(command === "infos"){
        let backupID = args[0];
        if(!backupID){
            return message.channel.send(":x: | You must specify a valid backup ID!");
        }
        // Fetch the backup
        backup.fetch(backupID).then((backupInfos) => {
            let embed = new Discord.MessageEmbed()
                .setAuthor("Backup Informations")
                // Display the backup ID
                .addField("ID", backupInfos.ID, true)
                // Displays the server from which this backup comes
                .addField("Server", backupInfos.server, true)
                // Display the size (in mb) of the backup
                .addField("Size", backupInfos.size, true)
                // Display when the backup was created
                .addField("Created at", timeConverter(backupInfos.createdTimestamp), true)
                .setColor("#FF0000");
            message.channel.send(embed);
        }).catch((err) => {
            // if the backup wasn't found
            return message.channel.send(":x: | No backup found for `"+backupID+"`!");
        });
    }

});

//Your secret token to log the bot in. (never share this to anyone!)
client.login(settings.token);

function timeConverter(t) {
    var a = new Date(t);
    var today = new Date();
    var yesterday = new Date(Date.now() - 86400000);
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    if (a.setHours(0,0,0,0) == today.setHours(0,0,0,0))
        return "today, " + hour + ":" + min;
    else if (a.setHours(0,0,0,0) == yesterday.setHours(0,0,0,0))
        return "yesterday, " + hour + ":" + min;
    else if (year == today.getFullYear())
        return date + " " + month + ", " + hour + ":" + min;
    else
        return date + " " + month + " " + year + ", " + hour + ":" + min;
}
```