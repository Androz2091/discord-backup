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
/**
 * Gets the permissions for a channel
 */
function fetchChannelPermissions(channel) {
    var permissions = [];
    channel.permissionOverwrites
        .filter(function (p) { return p.type === 'role'; })
        .forEach(function (perm) {
        // For each overwrites permission
        var role = channel.guild.roles.get(perm.id);
        if (role) {
            permissions.push({
                roleName: role.name,
                allow: perm.allow,
                deny: perm.deny
            });
        }
    });
    return permissions;
}
exports.fetchChannelPermissions = fetchChannelPermissions;
/**
 * Fetches the voice channel data that is necessary for the backup
 */
function fetchVoiceChannelData(channel) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                    var channelData;
                    return __generator(this, function (_a) {
                        channelData = {
                            type: 'voice',
                            name: channel.name,
                            bitrate: channel.bitrate,
                            userLimit: channel.userLimit,
                            parent: channel.parent ? channel.parent.name : null,
                            permissions: fetchChannelPermissions(channel)
                        };
                        /* Return channel data */
                        resolve(channelData);
                        return [2 /*return*/];
                    });
                }); })];
        });
    });
}
exports.fetchVoiceChannelData = fetchVoiceChannelData;
/**
 * Fetches the text channel data that is necessary for the backup
 */
function fetchTextChannelData(channel, options) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                    var channelData, messageCount;
                    return __generator(this, function (_a) {
                        channelData = {
                            type: 'text',
                            name: channel.name,
                            nsfw: channel.nsfw,
                            rateLimitPerUser: channel.rateLimitPerUser,
                            parent: channel.parent ? channel.parent.name : null,
                            topic: channel.topic,
                            permissions: fetchChannelPermissions(channel),
                            messages: []
                        };
                        messageCount = isNaN(options.maxMessagesPerChannel) ? 10 : options.maxMessagesPerChannel;
                        channel.fetchMessages({ limit: messageCount })
                            .then(function (fetched) {
                            fetched.forEach(function (msg) {
                                if (!msg.author || channelData.messages.length >= messageCount) {
                                    return;
                                }
                                channelData.messages.push({
                                    username: msg.author.username,
                                    avatar: msg.author.displayAvatarURL,
                                    content: msg.cleanContent
                                });
                            });
                            /* Return channel data */
                            resolve(channelData);
                        })
                            .catch(function () {
                            channelData.messages = [];
                            resolve(channelData);
                        });
                        return [2 /*return*/];
                    });
                }); })];
        });
    });
}
exports.fetchTextChannelData = fetchTextChannelData;
/**
 * Creates a category for the guild
 */
function loadCategory(categoryData, guild) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    guild.createChannel(categoryData.name, { type: 'category' }).then(function (category) { return __awaiter(_this, void 0, void 0, function () {
                        var finalPermissions;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    finalPermissions = [];
                                    categoryData.permissions.forEach(function (perm) {
                                        var role = guild.roles.find(function (r) { return r.name === perm.roleName; });
                                        if (role) {
                                            finalPermissions.push({
                                                id: role.id,
                                                allow: perm.allow,
                                                deny: perm.deny
                                            });
                                        }
                                    });
                                    return [4 /*yield*/, category.replacePermissionOverwrites({
                                            // Update category permissions
                                            overwrites: finalPermissions
                                        })];
                                case 1:
                                    _a.sent();
                                    resolve(category); // Return the category
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                })];
        });
    });
}
exports.loadCategory = loadCategory;
/**
 * Create a channel and returns it
 */
function loadChannel(channelData, guild, category) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                    var createOptions;
                    var _this = this;
                    return __generator(this, function (_a) {
                        createOptions = {
                            type: null,
                            parent: category
                        };
                        if (channelData.type === 'text') {
                            createOptions.nsfw = channelData.nsfw;
                            createOptions.rateLimitPerUser = channelData.rateLimitPerUser;
                            createOptions.type = 'text';
                        }
                        else if (channelData.type === 'voice') {
                            createOptions.bitrate = channelData.bitrate * 1000;
                            createOptions.userLimit = channelData.userLimit;
                            createOptions.type = 'voice';
                        }
                        guild.createChannel(channelData.name, createOptions).then(function (channel) { return __awaiter(_this, void 0, void 0, function () {
                            var finalPermissions;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        finalPermissions = [];
                                        channelData.permissions.forEach(function (perm) {
                                            var role = guild.roles.find(function (r) { return r.name === perm.roleName; });
                                            if (role) {
                                                finalPermissions.push({
                                                    id: role.id,
                                                    allow: perm.allow,
                                                    deny: perm.deny
                                                });
                                            }
                                        });
                                        return [4 /*yield*/, channel.replacePermissionOverwrites({
                                                // Update category permissions
                                                overwrites: finalPermissions
                                            })];
                                    case 1:
                                        _a.sent();
                                        /* Load messages */
                                        if (channelData.type === 'text') {
                                            channel
                                                .createWebhook('MessagesBackup', channel.client.user.displayAvatarURL)
                                                .then(function (webhook) { return __awaiter(_this, void 0, void 0, function () {
                                                var messages, _i, messages_1, msg;
                                                return __generator(this, function (_a) {
                                                    messages = channelData.messages
                                                        .filter(function (m) { return m.content.length > 0; })
                                                        .reverse();
                                                    for (_i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
                                                        msg = messages_1[_i];
                                                        webhook.send(msg.content, {
                                                            username: msg.username,
                                                            avatarURL: msg.avatar
                                                        });
                                                    }
                                                    resolve(channel); // Return the channel
                                                    return [2 /*return*/];
                                                });
                                            }); });
                                        }
                                        else {
                                            resolve(channel); // Return the channel
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                    });
                }); })];
        });
    });
}
exports.loadChannel = loadChannel;
/**
 * Delete all roles, all channels, all emojis, etc... of a guild
 */
function clearGuild(guild) {
    return __awaiter(this, void 0, void 0, function () {
        var webhooks, bans, integrations;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    guild.roles
                        .filter(function (role) { return !role.managed && role.editable && role.id !== guild.id; })
                        .forEach(function (role) {
                        role.delete().catch(function () { });
                    });
                    guild.channels.forEach(function (channel) {
                        channel.delete().catch(function () { });
                    });
                    guild.emojis.forEach(function (emoji) {
                        emoji.delete().catch(function () { });
                    });
                    return [4 /*yield*/, guild.fetchWebhooks()];
                case 1:
                    webhooks = _a.sent();
                    webhooks.forEach(function (webhook) {
                        webhook.delete().catch(function () { });
                    });
                    return [4 /*yield*/, guild.fetchBans()];
                case 2:
                    bans = _a.sent();
                    bans.forEach(function (user) {
                        if (!user.id)
                            return;
                        guild.unban(user.id).catch(function () { });
                    });
                    return [4 /*yield*/, guild.fetchIntegrations()];
                case 3:
                    integrations = _a.sent();
                    integrations.forEach(function (integration) {
                        integration.delete();
                    });
                    guild.setAFKChannel(null);
                    guild.setAFKTimeout(60 * 5);
                    guild.setIcon(null);
                    guild.setBanner(null).catch(function () { });
                    guild.setSplash(null).catch(function () { });
                    guild.setDefaultMessageNotifications("MENTIONS");
                    guild.setEmbed({
                        enabled: false,
                        channel: null
                    });
                    guild.setExplicitContentFilter(0);
                    guild.setSystemChannel(null);
                    guild.setSystemChannelFlags([
                        "WELCOME_MESSAGE_DISABLED",
                        "BOOST_MESSAGE_DISABLED"
                    ]);
                    guild.setVerificationLevel(0);
                    return [2 /*return*/];
            }
        });
    });
}
exports.clearGuild = clearGuild;
