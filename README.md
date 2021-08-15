# Discord Backup

[![downloadsBadge](https://img.shields.io/npm/dt/discord-backup?style=for-the-badge)](https://npmjs.com/discord-backup)
[![versionBadge](https://img.shields.io/npm/v/discord-backup?style=for-the-badge)](https://npmjs.com/discord-backup)

**Note**: this module uses recent discordjs features and requires discord.js v13.

Discord Backup is a powerful [Node.js](https://nodejs.org) module that allows you to easily manage discord server backups.

* Unlimited backups!
* Backup creation takes less than 10 seconds!
* Even restores messages with webhooks!
* And restores everything that is possible to restore (channels, roles, permissions, bans, emojis, name, icon, and more!)

## Changelog

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
// Load modules
const DJS = require("discord.js");
const backup = require("discord-backup");
const client = new DJS.Client({
  intents: [DJS.Intents.FLAGS.GUILDS, DJS.Intents.FLAGS.GUILD_MESSAGES]
});

const settings = {
  prefix: "b!",
  token: "YOUR_BOT_TOKEN"
};

client.on("ready", () => {
  console.log("I'm ready !");
});
client.on("error", console.error);
client.on("warn", console.warn);

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild || !message.guild.available) return;
  if (!client.application?.owner) await client.application?.fetch();

  if (message.content === `${settings.prefix}deploy` && message.author.id === client.application.owner.id) {
    await message.guild.commands.set([
      {
        name: "create",
        description: "Create a backup of the server"
      },
      {
        name: "load",
        description: "Load a backup on the server",
        options: [
          {
            name: "id",
            type: "STRING",
            description: "The backup id",
            required: true
          }
        ]
      },
      {
        name: "info",
        description: "Show info of a backup id",
        options: [
          {
            name: "id",
            type: "STRING",
            description: "The backup id",
            required: true
          }
        ]
      }
   ]);

    await message.reply("Deployed!");
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand() || !interaction.guildId) return;

  if (interaction.commandName === "create") {
    await interaction.deferReply();
    // Check member permissions
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.editReply({ content: ":x: | You must be an administrator of this server to request a backup!" });
    }
    try {
      // Create the backup
      const backupData = await backup.create(interaction.guild, {
        jsonBeautify: true
      });
      // And send informations to the backup owner
      interaction.user.send({ content: `The backup has been created! To load it, type this command on the server of your choice: \`\/load ${backupData.id}\`` });

      interaction.followUp({ content: ":white_check_mark: Backup successfully created. The backup ID was sent in dm!" });
    } catch (err) {
      console.log(err);
      // if the backup wasn't created
      return interaction.followUp({ content: ":x: | An error occurred while creating backup " });
    }

  } else if (interaction.commandName === "load") {
    await interaction.deferReply();
    // Check member permissions
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.editReply({ content: ":x: | You must be an administrator of this server to request a backup!" });
    }
    // Get the backup id from user input
    let backupID = interaction.options.get("id").value;
    // Fetching the backup to know if it exist
    try {
      await backup.fetch(backupID);
      // If the backup exists, request for confirmation
      // creating confirmation buttons
      const confirmRow = new DJS.MessageActionRow()
        .addComponents(
          new DJS.MessageButton()
          .setStyle("SUCCESS")
          .setLabel("Confirm")
          .setCustomId("confirm"),
          new DJS.MessageButton()
          .setStyle("SECONDARY")
          .setLabel("Cancel")
          .setCustomId("cancel")
        );
      //sending the button embed message
      const conf = await interaction.followUp({ content: ":warning: | When the backup is loaded, all the channels, roles, etc. will be replaced! Select `-confirm` to confirm!", components: [confirmRow] });

      const collector = conf.createMessageComponentCollector({
        filter: () => true,
        time: 90000
      });

      collector.on("collect", async (component) => {

        if (component.customId === "confirm") {
          // When the author of the command has confirmed that he wants to load the backup on his server
          interaction.user.send({ content: ":white_check_mark: | Start loading the backup!" });
          // Load the backup
          try {
            await backup.load(backupID, interaction.guild); // When the backup is loaded, delete them from the server
            backup.remove(backupID);
          } catch (err) {
            console.error(err);
            // If an error occurred
            interaction.user.send({ content: ":x: | Sorry, an error occurred... Please check that I have administrator permissions!" });
          };
          // if Cancel button was selected
        } else if (component.customId === "cancel") {
          conf.edit({ content: ":x: | Backup loading cancelled", components: [] });
        }
        component.deferUpdate();
      });
      // If timeout, nothing was selected
      collector.on("end", (_, reason) => {
        if (reason === "time") {
          conf.edit({ content: ":x: | Time's up! Cancelled backup loading!", components: [] });
        }
      });
    } catch (err) {
      console.log(err);
      // if the backup wasn't found
      return interaction.followUp({ content: `:x: | No backup found for \`backupID\`.` });
    }
  } else if (interaction.commandName === "info") {
    await interaction.deferReply();
    let backupID = interaction.options.get("id").value;

    // Fetch the backup
    try {
      const backupInfos = await backup.fetch(backupID);

      const date = new Date(backupInfos.data.createdTimestamp);
      const yyyy = date.getFullYear().toString(),
        mm = (date.getMonth() + 1).toString(),
        dd = date.getDate().toString();
      const formatedDate = `${yyyy}\/${(mm[1] ? mm : `0${mm[0]}`)}\/${(dd[1] ? dd:`0${dd[0]}`)}`;
      let embed = new DJS.MessageEmbed()
        .setAuthor("Backup Informations")
        // Display the backup ID
        .addField("Backup ID", backupInfos.id, false)
        // Displays the server from which this backup comes
        .addField("Server ID", backupInfos.data.guildID, false)
        // Display the size (in mb) of the backup
        .addField("Size", `${backupInfos.size} kb`, false)
        // Display when the backup was created
        .addField("Created at", formatedDate, false)
        .setColor("#FF0000");
      interaction.followUp({ embeds: [embed] });
    } catch (err) {
      // if the backup wasn't found
      return interaction.followUp({ content: `:x: | No backup found for \`backupID\`.` });
    };
    // if it didn't mathc any command
  } else {
    interaction.reply({
      content: "Unknown command!",
      ephemeral: true
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
