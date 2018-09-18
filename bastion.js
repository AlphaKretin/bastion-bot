"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./modules/bot");
const commands_1 = require("./modules/commands");
const cardSearch_1 = require("./modules/cardSearch");
const configs_1 = require("./modules/configs");
bot_1.bot.on("messageCreate", msg => {
    // ignore bots
    if (msg.author.bot) {
        return;
    }
    const prefix = configs_1.config.getConfig("prefix").getValue(msg);
    for (const cmd of commands_1.commands) {
        for (const name of cmd.names) {
            if (msg.content.startsWith(prefix + name)) {
                cmd.execute(msg).catch(e => bot_1.bot.createMessage(msg.channel.id, "Error!\n" + e));
                return;
            }
        }
    }
    cardSearch_1.cardSearch(msg);
});
bot_1.bot.connect();
//# sourceMappingURL=bastion.js.map