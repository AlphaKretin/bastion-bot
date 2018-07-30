import { bot } from "./modules/bot";
import { commands } from "./modules/commands";
import { data } from "./modules/data";

bot.on("messageCreate", msg => {
    // ignore bots
    if (!msg.author.bot) {
        for (const cmd of commands) {
            for (const name of cmd.names) {
                if (msg.content.startsWith("." + name)) {
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
                    bot.createMessage(msg.channel.id, card.name);
                }
            });
        }
    }
});
bot.connect();
