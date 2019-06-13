"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const libraryPages_1 = require("../modules/libraryPages");
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
        await mes.removeReactions();
        await libraryPages_1.addLibraryButtons(mes);
    }
}
function cond(msg) {
    const page = libraryPages_1.libraryPages[msg.channel.id];
    return msg.channel.id in libraryPages_1.libraryPages && page !== undefined && page.userID === msg.author.id;
}
exports.command = new Command_1.Command(names, func, cond, undefined, undefined, undefined, true);
//# sourceMappingURL=page.js.map