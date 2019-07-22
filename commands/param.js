"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const libraryPages_1 = require("../modules/libraryPages");
const util_1 = require("../modules/util");
const names = ["param"];
async function func(msg) {
    const content = util_1.trimMsg(msg);
    const pars = await libraryPages_1.params.getResults(content);
    if (pars.length > 0) {
        return await libraryPages_1.sendLibrary(pars, msg);
    }
    return msg.channel.createMessage("Sorry, I couldn't find any params matching `" + content + "`!");
}
const desc = (prefix) => "Searches by name for a function parameter from YGOPro Percy scripts, " +
    "and returns a paginated list of all matching results.\n" +
    `Use arrow reactions or \`${prefix}\`p<number> to navigate pages.\n` +
    `Use number reactions or \`${prefix}\`d<number> to show the description for a parameter.`;
exports.command = new Command_1.Command(names, func, undefined, desc, "query");
//# sourceMappingURL=param.js.map