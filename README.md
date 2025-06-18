# Discord Backup

[![downloadsBadge](https://img.shields.io/npm/dt/discord-backup?style=for-the-badge)](https://npmjs.com/discord-backup)
[![versionBadge](https://img.shields.io/npm/v/discord-backup?style=for-the-badge)](https://npmjs.com/discord-backup)

**Note**: this module now supports Discord.js v14.20+ with advanced rate limiting and error handling.

Discord Backup is a powerful [Node.js](https://nodejs.org) module that allows you to easily manage discord server backups.

* Unlimited backups!
* Backup creation takes less than 10 seconds!
* Even restores messages with webhooks!
* And restores everything that is possible to restore (channels, roles, permissions, bans, emojis, name, icon, and more!)

## Changelog v3.4.0

### New Features
* ✅ **Discord.js v14.20+ Support** - Fully compatible with latest Discord.js
* ✅ **Advanced Rate Limiting** - Built-in rate limiting to prevent API rate limit errors
* ✅ **Enhanced Error Handling** - Better error catching and recovery mechanisms
* ✅ **Memory Optimization** - Improved memory usage for large servers
* ✅ **Retry Logic** - Automatic retry for failed operations with exponential backoff
* ✅ **File Size Limits** - Automatic file size checking to prevent oversized attachments
* ✅ **Emoji Limits** - Respects server premium tier emoji limits
* ✅ **Sequential Processing** - Controlled message/role/channel creation to avoid rate limits

### Technical Changes (v14.20.0 Migration)

**🔧 Channel Type Updates:**
* Updated deprecated `ChannelType.GuildNewsThread` → `ChannelType.AnnouncementThread`
* Updated deprecated `ChannelType.GuildPrivateThread` → `ChannelType.PrivateThread`
* Updated deprecated `ChannelType.GuildPublicThread` → `ChannelType.PublicThread`
* Updated `ChannelType.GuildNews` → `ChannelType.GuildAnnouncement`

**⚡ Rate Limiting Implementation:**
* Added `withRetry()` function with exponential backoff (3 retries max)
* Sequential role creation with 250ms delays
* Sequential emoji creation with 500ms delays
* Sequential ban operations with 1000ms delays
* Message sending with 1000ms delays between messages

**🛡️ Error Handling Improvements:**
* Proper TypeScript error typing (`error: any`)
* Graceful degradation for failed operations
* Rate limit detection and automatic waiting
* Permission error immediate failing
* Memory-safe attachment processing (8MB limit)

**📱 Memory Optimizations:**
* Message limit enforcement (max 1000 per channel)
* Attachment size checking (8MB max)
* Emoji size limits (256KB max for base64)
* Embed field limiting (10 embeds, 25 fields each)
* Premium tier emoji limits enforcement

**🔄 Discord.js v14 Compatibility:**
* Updated discriminator handling (fallback to '0')
* New intent requirements documentation
* Fixed `ChannelNotCached` errors in test files
* Updated embed structure for v14
* Modern async/await patterns throughout

**🧪 Test File Enhancements:**
* Comprehensive test bot with all backup operations
* Channel reference management for guild clearing
* Fallback message sending mechanisms
* Advanced error handling for Discord API issues
* Rate limit-aware testing procedures

### Previous Changes
* Supports base64 for emojis/icon/banner backup
* New option to save backups in your own database
* `backup#delete()` removed in favor of `backup#remove()`

## Installation

```js
npm install --save discord-backup
```

## Examples

You can read this example bot on Github: [backups-bot](https://github.com/Androz2091/backups-bot)

### Create

Create a backup for the server specified in the parameters!

```js
/**
 * @param {Guild} [Guild] - The discord server you want to backup
 * @param {object} [options] - The backup options
 */

const backup = require("discord-backup");
backup.create(Guild, options).then((backupData) => {
    console.log(backupData.id); // NSJH2
});
```

Click [here](#create-advanced) to learn more about **backup options**.

### Load

Allows you to load a backup on a Discord server!

```js
/**
 * @param {string} [backupID] - The ID of the backup that you want to load
 * @param {Guild} [Guild] - The discord server on which you want to load the backup
 */

const backup = require("discord-backup");
backup.load(backupID, Guild).then(() => {
    backup.remove(backupID); // When the backup is loaded, it's recommended to delete it
});
```

### Fetch

Fetches information from a backup

```js
/**
 * @param {string} [backupID] - The ID of the backup to fetch
 */

const backup = require("discord-backup");
backup.fetch(backupID).then((backupInfos) => {
    console.log(backupInfos);
    /*
    {
        id: "BC5qo",
        size: 0.05
        data: {BackupData}
    }
    */
});
```

### Remove

**Warn**: once the backup is removed, it is impossible to recover it!

```js
/**
 * @param {string} [backupID] - The ID of the backup to remove
 */

const backup = require("discord-backup");
backup.remove(backupID);
```

### List

**Note**: `backup#list()` simply returns an array of IDs, you must fetch the ID to get complete information.

```js
const backup = require("discord-backup");
backup.list().then((backups) => {
    console.log(backups); // Expected Output [ "BC5qo", "Jdo91", ...]
});
```

### SetStorageFolder

Updates the storage folder to another

```js
const backup = require("discord-backup");
backup.setStorageFolder(__dirname+"/backups/");
await backup.create(guild); // Backup created in ./backups/
backup.setStorageFolder(__dirname+"/my-backups/");
await backup.create(guild); // Backup created in ./my-backups/
```

## Advanced usage

### Create [advanced]

You can use more options for backup creation:

```js
const backup = require("discord-backup");
backup.create(guild, {
    maxMessagesPerChannel: 10,
    jsonSave: false,
    jsonBeautify: true,
    doNotBackup: [ "roles",  "channels", "emojis", "bans" ],
    saveImages: "base64"
});
```

**maxMessagesPerChannel**: Maximum of messages to save in each channel. "0" won't save any messages.  
**jsonSave**: Whether to save the backup into a json file. You will have to save the backup data in your own db to load it later.  
**jsonBeautify**: Whether you want your json backup pretty formatted.  
**doNotBackup**: Things you don't want to backup. Available items are: `roles`, `channels`, `emojis`, `bans`.  
**saveImages**: How to save images like guild icon and emojis. Set to "url" by default, restoration may not work if the old server is deleted. So, `url` is recommended if you want to clone a server (or if you need very light backups), and `base64` if you want to backup a server. Save images as base64 creates heavier backups.

### Load [advanced]

As you can see, you're able to load a backup from your own data instead of from an ID:

```js
const backup = require("discord-backup");
backup.load(backupData, guild, {
    clearGuildBeforeRestore: true
});
```

**clearGuildBeforeRestore**: Whether to clear the guild (roles, channels, etc... will be deleted) before the backup restoration (recommended).  
**maxMessagesPerChannel**: Maximum of messages to restore in each channel. "0" won't restore any messages.

## Example Bot

```js
// Load modules (Discord.js v14.20+ Compatible)
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require("discord.js");
const backup = require("discord-backup");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const settings = {
    prefix: "b!",
    token: "YOURTOKEN"
};

client.once(Events.ClientReady, () => {
    console.log(`✅ Bot ${client.user.tag} is ready!`);
});

client.on(Events.MessageCreate, async message => {

    // This reads the first part of your message behind your prefix to see which command you want to use.
    let command = message.content.toLowerCase().slice(settings.prefix.length).split(" ")[0];

    // These are the arguments behind the commands.
    let args = message.content.split(" ").slice(1);

    // If the message does not start with your prefix return.
    // If the user that types a message is a bot account return.
    // If the command comes from DM return.
    if (!message.content.startsWith(settings.prefix) || message.author.bot || !message.guild) return;

    if(command === "create"){
        // Check member permissions (v14 syntax)
        if(!message.member.permissions.has("Administrator")){
            return message.channel.send(":x: | You must be an administrator of this server to request a backup!");
        }
        // Create the backup
        backup.create(message.guild, {
            jsonBeautify: true
        }).then((backupData) => {
            // And send informations to the backup owner
            message.author.send("The backup has been created! To load it, type this command on the server of your choice: `"+settings.prefix+"load "+backupData.id+"`!");
            message.channel.send(":white_check_mark: Backup successfully created. The backup ID was sent in dm!");
        });
    }

    if(command === "load"){
        // Check member permissions (v14 syntax)
        if(!message.member.permissions.has("Administrator")){
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
                    backup.remove(backupID);
                }).catch((err) => {
                    // If an error occurred
                    return message.author.send(":x: | Sorry, an error occurred... Please check that I have administrator permissions!");
                });
        }).catch((err) => {
            console.log(err);
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
            const date = new Date(backupInfos.data.createdTimestamp);
            const yyyy = date.getFullYear().toString(), mm = (date.getMonth()+1).toString(), dd = date.getDate().toString();
            const formatedDate = `${yyyy}/${(mm[1]?mm:"0"+mm[0])}/${(dd[1]?dd:"0"+dd[0])}`;
            let embed = new EmbedBuilder()
                .setAuthor({ name: "Backup Informations" })
                // Display the backup ID
                .addFields(
                    { name: "Backup ID", value: backupInfos.id, inline: false },
                    // Displays the server from which this backup comes
                    { name: "Server ID", value: backupInfos.data.guildID, inline: false },
                    // Display the size (in mb) of the backup
                    { name: "Size", value: `${backupInfos.size} kb`, inline: false },
                    // Display when the backup was created
                    { name: "Created at", value: formatedDate, inline: false }
                )
                .setColor("#FF0000");
            message.channel.send({ embeds: [embed] });
        }).catch((err) => {
            // if the backup wasn't found
            return message.channel.send(":x: | No backup found for `"+backupID+"`!");
        });
    }

});

//Your secret token to log the bot in. (never share this to anyone!)
client.login(settings.token);
```

## Restored things

Here are all things that can be restored with `discord-backup`:  

* Server icon  
* Server banner  
* Server region  
* Server splash  
* Server verification level  
* Server explicit content filter  
* Server default message notifications  
* Server embed channel  
* Server bans (with reasons)  
* Server emojis  
* Server AFK (channel and timeout)  
* Server channels (with permissions, type, nsfw, messages, etc...)  
* Server roles (with permissions, color, etc...)

Example of things that can't be restored:

* Server logs  
* Server invitations  
* Server vanity url
