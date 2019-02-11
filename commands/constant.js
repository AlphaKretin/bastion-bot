"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const libraryPages_1 = require("../modules/libraryPages");
const util_1 = require("../modules/util");
const names = ["c"];
async function func(msg) {
    const content = util_1.trimMsg(msg);
    const cons = await libraryPages_1.constants.getResults(content);
    if (cons.length > 0) {
        return await libraryPages_1.sendLibrary(cons, msg);
    }
    return msg.channel.createMessage("Sorry, I couldn't find any constants matching `" + content + "`!");
}
exports.command = new Command_1.Command(names, func);
//# sourceMappingURL=constant.js.map