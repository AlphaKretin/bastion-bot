import { bot } from "./modules/bot";
import { commands } from "./modules/commands";
import { config } from "./modules/configs";
import { data } from "./modules/data";

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
    const re = /{(.+)}/g;
    const result = re.exec(msg.content);
    if (result) {
        result.forEach(async (res, i) => {
            // ignore full match
            if (i > 0) {
                const card = await data.getCard(res, "en");
                if (card) {
                    bot.createMessage(msg.channel.id, card.name);
                }
            }
        });
    }
});
bot.connect();
