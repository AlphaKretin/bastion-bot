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
const desc = (prefix) => "Searches for a constant from YGOPro Percy scripts, and returns a paginated list of all matching results.\n" +
    `Use arrow reactions or \`${prefix}\`p<number> to navigate pages.\n` +
    `Use arrow reactions or \`${prefix}\`d<number> to show the description for a constant.`;
exports.command = new Command_1.Command(names, func, undefined, desc, "query");
//# sourceMappingURL=constant.js.map