"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cardSearch_1 = require("../modules/cardSearch");
const Command_1 = require("../modules/Command");
const matchPages_1 = require("../modules/matchPages");
const names = ["md", "viewmatch"];
async function func(msg) {
    const num = /\d+/.exec(msg.content);
    if (num === null) {
        return;
    }
    const index = parseInt(num[0], 10) - 1;
    const page = matchPages_1.matchPages[msg.channel.id];
    const cards = page.getSpan();
    const card = cards[index];
    const mes = page.msg;
    const extra = page.extra;
    if (mes && card) {
        const [profile] = await cardSearch_1.generateCardProfile(card, extra.lang, mes, extra.mobile);
        await mes.edit(profile);
    }
}
function cond(msg) {
    const page = matchPages_1.matchPages[msg.channel.id];
    return msg.channel.id in matchPages_1.matchPages && page !== undefined && page.userID === msg.author.id;
}
const desc = (prefix) => "Shows the profile for a given card," +
    ` from a list being displayed by \`${prefix}match\` or \`${prefix}search\`.\n` +
    "Detects edited messages.";
exports.command = new Command_1.Command(names, func, cond, desc, "index", undefined, true);
//# sourceMappingURL=mDesc.js.map