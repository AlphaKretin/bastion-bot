"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const commands_1 = require("../modules/commands");
const util_1 = require("../modules/util");
const names = ["link"];
const func = async (msg) => {
    const content = util_1.trimMsg(msg);
    const query = content.toLowerCase().replace(/\s+/g, "");
    if (query in commands_1.botOpts.links) {
        return msg.channel.createMessage(commands_1.botOpts.links[query]);
    }
    else {
        return msg.channel.createMessage("Sorry, I don't have a link with that name. Try one of the following:\n`" +
            Object.keys(commands_1.botOpts.links).join("`, `") +
            "`");
    }
};
exports.cmd = new Command_1.Command(names, func);
//# sourceMappingURL=link.js.map