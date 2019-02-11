"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Eris = __importStar(require("eris"));
const Command_1 = require("../modules/Command");
const libraryPages_1 = require("../modules/libraryPages");
const util_1 = require("../modules/util");
const names = ["d"];
async function func(msg) {
    const num = /\d+/.exec(msg.content);
    if (num === null) {
        return;
    }
    const index = parseInt(num[0], 10) - 1;
    const chan = msg.channel;
    if (!(chan instanceof Eris.GuildChannel)) {
        return;
    }
    const guild = chan.guild;
    const page = libraryPages_1.libraryPages[guild.id];
    await util_1.addLibraryDescription(page, index, guild.id);
}
function cond(msg) {
    const chan = msg.channel;
    if (!(chan instanceof Eris.GuildChannel)) {
        return false;
    }
    const guild = chan.guild;
    const page = libraryPages_1.libraryPages[guild.id];
    return guild.id in libraryPages_1.libraryPages && page !== undefined && page.userID === msg.author.id;
}
exports.command = new Command_1.Command(names, func, cond, undefined, true);
//# sourceMappingURL=desc.js.map