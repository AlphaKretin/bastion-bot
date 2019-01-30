"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const configs_1 = require("../modules/configs");
const util_1 = require("../modules/util");
const names = ["config"];
async function func(msg) {
    const content = util_1.trimMsg(msg);
    const terms = content.split(/ +/);
    const optName = terms[0];
    const val = terms.slice(1).join(" ");
    const opt = configs_1.config.getConfig(optName);
    opt.setValue(msg, val);
    return await msg.channel.createMessage(opt.name + " changed to " + opt.getValue(msg));
}
exports.command = new Command_1.Command(names, func);
//# sourceMappingURL=config.js.map