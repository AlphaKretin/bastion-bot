"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const names = ["ping"];
const func = async (msg) => {
    const time = Date.now();
    const mes = await msg.channel.createMessage("Pong!");
    const ping = new Date(Date.now() - time);
    await mes.edit("Pong! (" + ping.getMilliseconds() + " ms)");
    return mes;
};
const desc = "Sends a basic reply to test connectivity, and notes how long it took.";
exports.cmd = new Command_1.Command(names, func, undefined, desc);
//# sourceMappingURL=ping.js.map