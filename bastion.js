"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Eris = require("eris");
const fs = require("mz/fs");
const ygopro_data_1 = require("ygopro-data");
const commands_1 = require("./modules/commands");
const dataOpts = JSON.parse(fs.readFileSync("config/dataOpts.json", "utf8"));
ygopro_data_1.Driver
    .build(dataOpts, __dirname)
    .then(data => {
    const auth = JSON.parse(fs.readFileSync("config/auth.json", "utf8"));
    const erisOpts = { maxShards: "auto" };
    const bot = new Eris.Client(auth.token, erisOpts);
    bot.on("ready", () => {
        console.log("Logged in as %s - %s", bot.user.username, bot.user.id);
    });
    bot.on("messageCreate", msg => {
        // ignore bots
        if (!msg.author.bot) {
            for (const cmd of commands_1.commands) {
                for (const name of cmd.names) {
                    if (msg.content.startsWith("." + name)) {
                        const expo = {
                            bot,
                            commands: commands_1.commands,
                            ygo: data
                        };
                        cmd.execute(msg, expo).catch(e => bot.createMessage(msg.channel.id, "Error!\n" + e));
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
})
    .catch(e => {
    console.error(e);
    process.exit();
});
//# sourceMappingURL=bastion.js.map