"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const libraryPages_1 = require("../modules/libraryPages");
const names = ["d"];
async function func(msg) {
    const num = /\d+/.exec(msg.content);
    if (num === null) {
        return;
    }
    const index = parseInt(num[0], 10) - 1;
    const page = libraryPages_1.libraryPages[msg.channel.id];
    await libraryPages_1.addLibraryDescription(page, index, msg.channel.id);
}
function cond(msg) {
    const page = libraryPages_1.libraryPages[msg.channel.id];
    return msg.channel.id in libraryPages_1.libraryPages && page !== undefined && page.userID === msg.author.id;
}
const desc = (prefix) => "Shows the description for a given function, constant or parameter from YGOPro's scripts," +
    ` from a list being displayed by \`${prefix}f\`, \`${prefix}c\` or \`${prefix}param\`.\n` +
    "Detects edited messages.";
exports.command = new Command_1.Command(names, func, cond, desc, "index", undefined, true);
//# sourceMappingURL=desc.js.map