"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const stats_1 = require("../modules/stats");
const names = ["metric"];
const func = async (msg) => {
    const { activeUsers, cardCount, commandCount, cardsPerUser, commandsPerUser } = await stats_1.stats.getMetrics();
    return await msg.channel.createMessage("I've calculated the following metrics:\n"
        + "**" + activeUsers + " unique users** have searched for cards and/or used commands.\n"
        + "**" + cardCount + " cards** (non-unique) have been searched for.\n"
        + "Each active user has searched an average of **" + cardsPerUser.toFixed(2) + " cards** each.\n"
        + "**" + commandCount + " commands** (non-unique) have been used.\n"
        + "Each active user has used an average of **" + commandsPerUser.toFixed(2) + " commands** each.");
};
const desc = "Fetches various metrics from Bastion's tracked stats.";
exports.cmd = new Command_1.Command(names, func, undefined, desc, undefined, false, true);
//# sourceMappingURL=metrics.js.map