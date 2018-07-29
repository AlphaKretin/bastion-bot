"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const names = ["ping"];
const func = async (msg, data) => {
    await data.bot.createMessage(msg.channel.id, "Pong!");
};
exports.cmd = new Command_1.Command(names, func);
//# sourceMappingURL=ping.js.map