import { bot } from "./modules/bot";
import { cardSearch } from "./modules/cardSearch";
import { commands } from "./modules/commands";
import { config } from "./modules/configs";

bot.on("messageCreate", msg => {
    // ignore bots
    if (msg.author.bot) {
        return;
    }
    const prefix = config.getConfig("prefix").getValue(msg);
    for (const cmd of commands) {
        for (const name of cmd.names) {
            if (msg.content.startsWith(prefix + name)) {
                cmd.execute(msg).catch(e => bot.createMessage(msg.channel.id, "Error!\n" + e));
                return;
            }
        }
    }
    cardSearch(msg);
});
bot.connect();
