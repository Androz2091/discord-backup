# Discord Backup

**Note**: This package is under development and will be updated frequently.

Discord Backup is a powerful [Node.js](https://nodejs.org) module that allows you to easily manage discord server backups.

*   Restores channels
*   Restores emojis
*   Restores bans
*   Restores permissions (for role and channels)
*   Restores messages
*   Restores the guild configuration (notification settings, name, icon)

## Installation

```js
npm install --save discord-backup
```

### Required packages

*   [fs](https://www.npmjs.com/package/fs) used to store backups in json files (`npm install --save fs`)
*   [randomstring](https://www.npmjs.com/package/randomstring) used to generate backups ID (`npm install --save randomstring`)

### Optional

*   [discord.js](https://www.npmjs.com/package/discord.js) - (`npm install --save discord.js`)
*   [discord.js-commando](https://www.npmjs.com/package/discord.js-commando) - (`npm install --save discord.js-commando`)
*   [eris](https://www.npmjs.com/package/eris) - (`npm install --save eris`)

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
        size: "0.05MB"
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