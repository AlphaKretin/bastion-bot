"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Eris = require("eris");
function trimMsg(msg) {
    const m = msg instanceof Eris.Message ? msg.content : msg;
    return m
        .trim()
        .split(/ +/)
        .slice(1)
        .join(" ");
}
exports.trimMsg = trimMsg;
exports.getGuildFromMsg = (msg) => msg.channel instanceof Eris.TextChannel ? msg.channel.guild : undefined;
//# sourceMappingURL=util.js.map