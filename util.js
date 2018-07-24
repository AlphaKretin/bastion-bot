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
//# sourceMappingURL=util.js.map