"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const trivia_1 = require("../modules/trivia");
const names = ["tlock"];
const func = async (msg) => {
    const result = (await trivia_1.setLock(msg)) ? "allowed" : "forbidden";
    return await msg.channel.createMessage("The Trivia game is now " + result + " in this channel.");
};
const desc = "Toggles whether or not the Trivia game can be played in the channel this command was used in.";
exports.cmd = new Command_1.Command(names, func, undefined, desc, undefined, true);
//# sourceMappingURL=tlock.js.map