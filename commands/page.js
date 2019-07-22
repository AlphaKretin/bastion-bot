"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const libraryPages_1 = require("../modules/libraryPages");
const util_1 = require("../modules/util");
const names = ["p"];
async function func(msg) {
    const num = /\d+/.exec(msg.content);
    if (num === null) {
        return;
    }
    const pageNumber = parseInt(num[0], 10);
    const page = libraryPages_1.libraryPages[msg.channel.id];
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
            out = libraryPages_1.generateLibraryList(msg.channel.id);
        }
        await mes.edit(out);
        if (util_1.canReact(mes)) {
            await mes.removeReactions();
            await libraryPages_1.addLibraryButtons(mes);
        }
    }
}
function cond(msg) {
    const page = libraryPages_1.libraryPages[msg.channel.id];
    return msg.channel.id in libraryPages_1.libraryPages && page !== undefined && page.userID === msg.author.id;
}
const desc = (prefix) => "Changes the page of function, constant or parameter results from YGOPro's scripts," +
    ` for a list being displayed by \`${prefix}f\`, \`${prefix}c\` or \`${prefix}param\`.\n` +
    "Detects edited messages.";
exports.command = new Command_1.Command(names, func, cond, desc, "index", undefined, true);
//# sourceMappingURL=page.js.map