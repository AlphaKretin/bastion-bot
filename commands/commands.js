"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const commands_1 = require("../modules/commands");
const configs_1 = require("../modules/configs");
const util_1 = require("../modules/util");
const names = ["commands"];
async function func(msg) {
    const prefix = configs_1.config.getConfig("prefix").getValue(msg);
    const validCommands = commands_1.commands.filter(c => c.isCanExecute(msg));
    const commandProfiles = validCommands
        .map(c => {
        const base = "`" + prefix + c.names[0] + "`";
        if (c.desc) {
            const d = (typeof c.desc === "string" ? c.desc : c.desc(prefix)).split("\n")[0];
            return base + ": " + d;
        }
        return base;
    })
        .join("\n");
    const outs = util_1.messageCapSlice(commandProfiles);
    const chan = await msg.author.getDMChannel();
    for (const out of outs) {
        await chan.createMessage(out);
    }
    if (util_1.canReact(msg)) {
        msg.addReaction("📬");
    }
}
const desc = "Generates a list of commands the user has access to.";
exports.command = new Command_1.Command(names, func, undefined, desc);
//# sourceMappingURL=commands.js.map