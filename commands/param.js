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
        return await util_1.sendLibrary(pars, msg);
    }
    return msg.channel.createMessage("Sorry, I couldn't find any params matching `" + content + "`!");
}
exports.command = new Command_1.Command(names, func);
//# sourceMappingURL=param.js.map