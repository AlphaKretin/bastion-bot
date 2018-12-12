"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("../modules/bot");
const Command_1 = require("../modules/Command");
const configs_1 = require("../modules/configs");
const util_1 = require("../modules/util");
const names = ["config"];
async function func(msg) {
    const content = util_1.trimMsg(msg);
    const terms = content.split(/ +/);
    const optName = terms[0];
    const val = terms.slice(1).join(" ");
    try {
        const opt = configs_1.config.getConfig(optName);
        opt.setValue(val, msg);
        const outMsg = opt.name + " changed to " + opt.getValue(msg);
        bot_1.bot.createMessage(msg.channel.id, outMsg);
    }
    catch (e) {
        throw e;
    }
}
exports.command = new Command_1.Command(names, func);
//# sourceMappingURL=config.js.map