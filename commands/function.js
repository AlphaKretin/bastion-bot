"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const libraryPages_1 = require("../modules/libraryPages");
const util_1 = require("../modules/util");
const names = ["f"];
async function func(msg) {
    const content = util_1.trimMsg(msg);
    const funcs = await libraryPages_1.functions.getResults(content);
    if (funcs.length > 0) {
        return await libraryPages_1.sendLibrary(funcs, msg);
    }
    return msg.channel.createMessage("Sorry, I couldn't find any functions matching `" + content + "`!");
}
const desc = (prefix) => "Searches by name for a function from YGOPro Percy scripts, " +
    "and returns a paginated list of all matching results.\n" +
    `Use arrow reactions or \`${prefix}\`p<number> to navigate pages.\n` +
    `Use number reactions or \`${prefix}\`d<number> to show the description for a function.`;
exports.command = new Command_1.Command(names, func, undefined, desc, "query");
//# sourceMappingURL=function.js.map