"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var discord_js_1 = require("discord.js");
var master = discord_js_1.version.split('.')[0] === '12';
var axios_1 = require("axios");
var path_1 = require("path");
var fs_1 = require("fs");
var util_1 = require("util");
var writeFileAsync = util_1.promisify(fs_1.writeFile);
var readdirAsync = util_1.promisify(fs_1.readdir);
var createStable = require("./stable/create");
var loadStable = require("./stable/load");
var utilStable = require("./stable/util");
var backups = __dirname + "/backups";
if (!fs_1.existsSync(backups)) {
    fs_1.mkdirSync(backups);
}
/**
 * Checks if a backup exists and returns its data
 */
var getBackupData = function (backupID) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                var files, file, backupData;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, readdirAsync(backups)];
                        case 1:
                            files = _a.sent();
                            file = files.filter(function (f) { return f.split('.').pop() === 'json'; }).find(function (f) { return f === backupID + ".json"; });
                            if (file) {
                                backupData = require("" + backups + path_1.sep + file);
                                // Returns backup informations
                                resolve(backupData);
                            }
                            else {
                                // If no backup was found, return an error message
                                reject('No backup found');
                            }
                            return [2 /*return*/];
                    }
                });
            }); })];
    });
}); };
/**
 * Fetches a backyp and returns the information about it
 */
exports.fetch = function (backupID) {
    return new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            getBackupData(backupID)
                .then(function (backupData) {
                var size = fs_1.statSync("" + backups + path_1.sep + backupID + ".json").size; // Gets the size of the file using fs
                var backupInfos = {
                    data: backupData,
                    id: backupID,
                    size: Number((size / 1024 / 1024).toFixed(2))
                };
                // Returns backup informations
                resolve(backupInfos);
            })
                .catch(function () {
                reject('No backup found');
            });
            return [2 /*return*/];
        });
    }); });
};
/**
 * Creates a new backup and saves it to the storage
 */
exports.create = function (guild, options) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                var backupData, res, res, res, _a, _b, _c, _d, backupJSON, e_1;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            if (!!master) return [3 /*break*/, 23];
                            _e.label = 1;
                        case 1:
                            _e.trys.push([1, 21, , 22]);
                            backupData = {
                                name: guild.name,
                                region: guild.region,
                                verificationLevel: guild.verificationLevel,
                                explicitContentFilter: guild.explicitContentFilter,
                                defaultMessageNotifications: guild.defaultMessageNotifications,
                                afk: guild.afkChannel ? { name: guild.afkChannel.name, timeout: guild.afkTimeout } : null,
                                embed: {
                                    enabled: guild.embedEnabled,
                                    channel: guild.embedChannel ? guild.embedChannel.name : null
                                },
                                channels: { categories: [], others: [] },
                                roles: [],
                                bans: [],
                                emojis: [],
                                createdTimestamp: Date.now(),
                                guildID: guild.id,
                                id: discord_js_1.SnowflakeUtil.generate(Date.now())
                            };
                            if (!guild.iconURL) return [3 /*break*/, 4];
                            if (!(options && options.saveImages && options.saveImages === 'base64')) return [3 /*break*/, 3];
                            return [4 /*yield*/, axios_1.default.get(guild.iconURL, { responseType: 'arraybuffer' })];
                        case 2:
                            res = _e.sent();
                            backupData.iconBase64 = Buffer.from(res.data, 'binary').toString('base64');
                            _e.label = 3;
                        case 3:
                            backupData.iconURL = guild.iconURL;
                            _e.label = 4;
                        case 4:
                            if (!guild.splashURL) return [3 /*break*/, 7];
                            if (!(options && options.saveImages && options.saveImages === 'base64')) return [3 /*break*/, 6];
                            return [4 /*yield*/, axios_1.default.get(guild.splashURL, { responseType: 'arraybuffer' })];
                        case 5:
                            res = _e.sent();
                            backupData.splashBase64 = Buffer.from(res.data, 'binary').toString('base64');
                            _e.label = 6;
                        case 6:
                            backupData.splashURL = guild.splashURL;
                            _e.label = 7;
                        case 7:
                            if (!guild.bannerURL) return [3 /*break*/, 10];
                            if (!(options && options.saveImages && options.saveImages === 'base64')) return [3 /*break*/, 9];
                            return [4 /*yield*/, axios_1.default.get(guild.bannerURL, { responseType: 'arraybuffer' })];
                        case 8:
                            res = _e.sent();
                            backupData.bannerBase64 = Buffer.from(res.data, 'binary').toString('base64');
                            _e.label = 9;
                        case 9:
                            backupData.bannerURL = guild.bannerURL;
                            _e.label = 10;
                        case 10:
                            if (!(!options || !(options.doNotBackup || []).includes('bans'))) return [3 /*break*/, 12];
                            // Backup bans
                            _a = backupData;
                            return [4 /*yield*/, createStable.getBans(guild)];
                        case 11:
                            // Backup bans
                            _a.bans = _e.sent();
                            _e.label = 12;
                        case 12:
                            if (!(!options || !(options.doNotBackup || []).includes('roles'))) return [3 /*break*/, 14];
                            // Backup roles
                            _b = backupData;
                            return [4 /*yield*/, createStable.getRoles(guild)];
                        case 13:
                            // Backup roles
                            _b.roles = _e.sent();
                            _e.label = 14;
                        case 14:
                            if (!(!options || !(options.doNotBackup || []).includes('emojis'))) return [3 /*break*/, 16];
                            // Backup emojis
                            _c = backupData;
                            return [4 /*yield*/, createStable.getEmojis(guild, options)];
                        case 15:
                            // Backup emojis
                            _c.emojis = _e.sent();
                            _e.label = 16;
                        case 16:
                            if (!(!options || !(options.doNotBackup || []).includes('channels'))) return [3 /*break*/, 18];
                            // Backup channels
                            _d = backupData;
                            return [4 /*yield*/, createStable.getChannels(guild, options)];
                        case 17:
                            // Backup channels
                            _d.channels = _e.sent();
                            _e.label = 18;
                        case 18:
                            if (!(!options || options.jsonSave === undefined || options.jsonSave)) return [3 /*break*/, 20];
                            backupJSON = options.jsonBeautify
                                ? JSON.stringify(backupData, null, 4)
                                : JSON.stringify(backupData);
                            // Save the backup
                            return [4 /*yield*/, writeFileAsync("" + backups + path_1.sep + backupData.id + ".json", backupJSON, 'utf-8')];
                        case 19:
                            // Save the backup
                            _e.sent();
                            _e.label = 20;
                        case 20:
                            // Returns ID
                            resolve(backupData);
                            return [3 /*break*/, 22];
                        case 21:
                            e_1 = _e.sent();
                            return [2 /*return*/, reject(e_1)];
                        case 22: return [3 /*break*/, 24];
                        case 23:
                            reject("Only 11.5-dev branch of discord.js library is supported by this discord-backup version. Install the one for the master branch with 'npm install discord-backup'.");
                            _e.label = 24;
                        case 24: return [2 /*return*/];
                    }
                });
            }); })];
    });
}); };
/**
 * Loads a backup for a guild
 */
exports.load = function (backup, guild, options) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                var backupData, _a, e_2, e_3;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!guild) {
                                return [2 /*return*/, reject('Invalid guild')];
                            }
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 19, , 20]);
                            if (!(typeof backup === 'string')) return [3 /*break*/, 3];
                            return [4 /*yield*/, getBackupData(backup)];
                        case 2:
                            _a = _b.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            _a = backup;
                            _b.label = 4;
                        case 4:
                            backupData = _a;
                            if (!!master) return [3 /*break*/, 17];
                            _b.label = 5;
                        case 5:
                            _b.trys.push([5, 15, , 16]);
                            if (!(!options || options.clearGuildBeforeRestore === undefined || options.clearGuildBeforeRestore)) return [3 /*break*/, 7];
                            // Clear the guild
                            return [4 /*yield*/, utilStable.clearGuild(guild)];
                        case 6:
                            // Clear the guild
                            _b.sent();
                            _b.label = 7;
                        case 7: 
                        // Restore guild configuration
                        return [4 /*yield*/, loadStable.conf(guild, backupData)];
                        case 8:
                            // Restore guild configuration
                            _b.sent();
                            // Restore guild roles
                            return [4 /*yield*/, loadStable.roles(guild, backupData)];
                        case 9:
                            // Restore guild roles
                            _b.sent();
                            // Restore guild channels
                            return [4 /*yield*/, loadStable.channels(guild, backupData)];
                        case 10:
                            // Restore guild channels
                            _b.sent();
                            // Restore afk channel and timeout
                            return [4 /*yield*/, loadStable.afk(guild, backupData)];
                        case 11:
                            // Restore afk channel and timeout
                            _b.sent();
                            // Restore guild emojis
                            return [4 /*yield*/, loadStable.emojis(guild, backupData)];
                        case 12:
                            // Restore guild emojis
                            _b.sent();
                            // Restore guild bans
                            return [4 /*yield*/, loadStable.bans(guild, backupData)];
                        case 13:
                            // Restore guild bans
                            _b.sent();
                            // Restore embed channel
                            return [4 /*yield*/, loadStable.embedChannel(guild, backupData)];
                        case 14:
                            // Restore embed channel
                            _b.sent();
                            return [3 /*break*/, 16];
                        case 15:
                            e_2 = _b.sent();
                            return [2 /*return*/, reject(e_2)];
                        case 16: 
                        // Then return the backup data
                        return [2 /*return*/, resolve(backupData)];
                        case 17:
                            reject("Only 11.5-dev branch of discord.js library is supported by this discord-backup version. Install the one for the master branch with 'npm install discord-backup'.");
                            _b.label = 18;
                        case 18: return [3 /*break*/, 20];
                        case 19:
                            e_3 = _b.sent();
                            return [2 /*return*/, reject('No backup found')];
                        case 20: return [2 /*return*/];
                    }
                });
            }); })];
    });
}); };
/**
 * Removes a backup
 */
exports.remove = function (backupID) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                try {
                    require("" + backups + path_1.sep + backupID + ".json");
                    fs_1.unlinkSync("" + backups + path_1.sep + backupID + ".json");
                    resolve();
                }
                catch (error) {
                    reject('Backup not found');
                }
            })];
    });
}); };
/**
 * Returns the list of all backup
 */
exports.list = function () { return __awaiter(void 0, void 0, void 0, function () {
    var files;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, readdirAsync(backups)];
            case 1:
                files = _a.sent();
                return [2 /*return*/, files.map(function (f) { return f.split('.')[0]; })];
        }
    });
}); };
/**
 * Change the storage path
 */
exports.setStorageFolder = function (path) {
    if (path.endsWith(path_1.sep)) {
        path = path.substr(0, path.length - 1);
    }
    backups = path;
    if (!fs_1.existsSync(backups)) {
        fs_1.mkdirSync(backups);
    }
};
exports.default = {
    create: exports.create,
    fetch: exports.fetch,
    list: exports.list,
    load: exports.load,
    remove: exports.remove
};
