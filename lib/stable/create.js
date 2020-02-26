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
var axios_1 = require("axios");
var util_1 = require("./util");
/**
 * Returns an array with the banned members of the guild
 * @param {Guild} guild The Discord guild
 * @returns {Promise<BanData[]>} The banned members
 */
function getBans(guild) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var bans = [];
                    guild
                        .fetchBans()
                        .then(function (cases) {
                        // Gets the list of the banned members
                        cases.forEach(function (user) {
                            if (!user.id) {
                                return;
                            }
                            bans.push({
                                id: user.id // Banned member ID
                            });
                        });
                        resolve(bans);
                    })
                        .catch(function () {
                        resolve(bans);
                    });
                })];
        });
    });
}
exports.getBans = getBans;
/**
 * Returns an array with the roles of the guild
 * @param {Guild} guild The discord guild
 * @returns {Promise<RoleData[]>} The roles of the guild
 */
function getRoles(guild) {
    return __awaiter(this, void 0, void 0, function () {
        var roles;
        return __generator(this, function (_a) {
            roles = [];
            guild.roles
                .sort(function (a, b) { return b.position - a.position; })
                .forEach(function (role) {
                if (role.id !== (guild.defaultRole ? guild.defaultRole.id : '')) {
                    // If the role is not @everyone
                    var roleData = {
                        name: role.name,
                        color: role.hexColor,
                        hoist: role.hoist,
                        permissions: role.permissions,
                        mentionable: role.mentionable,
                        position: role.position
                    };
                    roles.push(roleData);
                }
            });
            return [2 /*return*/, roles];
        });
    });
}
exports.getRoles = getRoles;
/**
 * Returns an array with the emojis of the guild
 * @param {Guild} guild The discord guild
 * @param {CreateOptions} options The backup options
 * @returns {Promise<EmojiData[]>} The emojis of the guild
 */
function getEmojis(guild, options) {
    return __awaiter(this, void 0, void 0, function () {
        var emojis;
        var _this = this;
        return __generator(this, function (_a) {
            emojis = [];
            guild.emojis.forEach(function (emoji) { return __awaiter(_this, void 0, void 0, function () {
                var eData, res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            eData = {
                                name: emoji.name
                            };
                            if (!(options.saveImages && options.saveImages === 'base64')) return [3 /*break*/, 2];
                            return [4 /*yield*/, axios_1.default.get(emoji.url, { responseType: 'arraybuffer' })];
                        case 1:
                            res = _a.sent();
                            eData.base64 = Buffer.from(res.data, 'binary').toString('base64');
                            return [3 /*break*/, 3];
                        case 2:
                            eData.url = emoji.url;
                            _a.label = 3;
                        case 3:
                            emojis.push(eData);
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/, emojis];
        });
    });
}
exports.getEmojis = getEmojis;
/**
 * Returns an array with the channels of the guild
 * @param {Guild} guild The discord guild
 * @param {CreateOptions} options The backup options
 * @returns {ChannelData[]} The channels of the guild
 */
function getChannels(guild, options) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                    var channels, categories, _i, categories_1, category, categoryData, children, _a, children_1, child, channelData, channelData, others, _b, others_1, channel, channelData, channelData;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                channels = {
                                    categories: [],
                                    others: []
                                };
                                categories = guild.channels
                                    .filter(function (ch) { return ch.type === 'category'; })
                                    .sort(function (a, b) { return a.position - b.position; })
                                    .array();
                                _i = 0, categories_1 = categories;
                                _c.label = 1;
                            case 1:
                                if (!(_i < categories_1.length)) return [3 /*break*/, 9];
                                category = categories_1[_i];
                                categoryData = {
                                    name: category.name,
                                    permissions: util_1.fetchChannelPermissions(category),
                                    children: [] // The children channels of the category
                                };
                                children = category.children.sort(function (a, b) { return a.position - b.position; }).array();
                                _a = 0, children_1 = children;
                                _c.label = 2;
                            case 2:
                                if (!(_a < children_1.length)) return [3 /*break*/, 7];
                                child = children_1[_a];
                                if (!(child.type === 'text')) return [3 /*break*/, 4];
                                return [4 /*yield*/, util_1.fetchTextChannelData(child, options)];
                            case 3:
                                channelData = _c.sent();
                                categoryData.children.push(channelData); // And then push the child in the categoryData
                                return [3 /*break*/, 6];
                            case 4: return [4 /*yield*/, util_1.fetchVoiceChannelData(child)];
                            case 5:
                                channelData = _c.sent();
                                categoryData.children.push(channelData); // And then push the child in the categoryData
                                _c.label = 6;
                            case 6:
                                _a++;
                                return [3 /*break*/, 2];
                            case 7:
                                channels.categories.push(categoryData); // Update channels object
                                _c.label = 8;
                            case 8:
                                _i++;
                                return [3 /*break*/, 1];
                            case 9:
                                others = guild.channels
                                    .filter(function (ch) { return !ch.parent && ch.type !== 'category'; })
                                    .sort(function (a, b) { return a.position - b.position; })
                                    .array();
                                _b = 0, others_1 = others;
                                _c.label = 10;
                            case 10:
                                if (!(_b < others_1.length)) return [3 /*break*/, 15];
                                channel = others_1[_b];
                                if (!(channel.type === 'text')) return [3 /*break*/, 12];
                                return [4 /*yield*/, util_1.fetchTextChannelData(channel, options)];
                            case 11:
                                channelData = _c.sent();
                                channels.others.push(channelData); // Update channels object
                                return [3 /*break*/, 14];
                            case 12: return [4 /*yield*/, util_1.fetchVoiceChannelData(channel)];
                            case 13:
                                channelData = _c.sent();
                                channels.others.push(channelData); // Update channels object
                                _c.label = 14;
                            case 14:
                                _b++;
                                return [3 /*break*/, 10];
                            case 15:
                                resolve(channels); // Returns the list of the channels
                                return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
exports.getChannels = getChannels;
