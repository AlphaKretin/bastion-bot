"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const matchPages_1 = require("../modules/matchPages");
const util_1 = require("../modules/util");
const names = ["mp", "matchpage"];
async function func(msg) {
    const num = /\d+/.exec(msg.content);
    if (num === null) {
        return;
    }
    const pageNumber = parseInt(num[0], 10);
    const page = matchPages_1.matchPages[msg.channel.id];
    const curPage = page.currentPage;
    const distance = pageNumber - curPage;
    if (distance > 0) {
        page.forward(distance * 10);
    }
    else if (distance < 0) {
        page.back(-distance * 10);
    }
    const mes = page.msg;
    if (mes) {
        let out = mes.content;
        if (page.currentPage !== curPage) {
            out = matchPages_1.generateCardList(msg.channel.id);
        }
        await mes.edit(out);
        if (util_1.canReact(mes)) {
            await mes.removeReactions();
            await matchPages_1.addMatchButtons(mes);
        }
    }
}
function cond(msg) {
    const page = matchPages_1.matchPages[msg.channel.id];
    return msg.channel.id in matchPages_1.matchPages && page !== undefined && page.userID === msg.author.id;
}
const desc = (prefix) => "Changes the page of card results," +
    ` for a list being displayed by \`${prefix}match\` or \`${prefix}search\`.\n` +
    "Detects edited messages.";
exports.command = new Command_1.Command(names, func, cond, desc, undefined, undefined, true);
//# sourceMappingURL=mPage.js.map