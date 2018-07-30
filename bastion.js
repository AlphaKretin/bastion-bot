"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./modules/bot");
const commands_1 = require("./modules/commands");
const data_1 = require("./modules/data");
bot_1.bot.on("messageCreate", msg => {
    // ignore bots
    if (!msg.author.bot) {
        for (const cmd of commands_1.commands) {
            for (const name of cmd.names) {
                if (msg.content.startsWith("." + name)) {
                    cmd.execute(msg).catch(e => bot_1.bot.createMessage(msg.channel.id, "Error!\n" + e));
                    return;
                }
            }
        }
        const re = /{(.+)}/g;
        const result = re.exec(msg.content);
        if (result) {
            result.forEach(async (res, i) => {
                // ignore full match
                if (i > 0) {
                    const card = await data_1.data.getCard(res, "en");
                    bot_1.bot.createMessage(msg.channel.id, card.name);
                }
            });
        }
    }
});
bot_1.bot.connect();
//# sourceMappingURL=bastion.js.map