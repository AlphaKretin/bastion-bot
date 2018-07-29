import * as Eris from "eris";
import * as fs from "mz/fs";
import { Driver as ygoData } from "ygopro-data";
import { ICommandExpose } from "./modules/Command";
import { commands } from "./modules/commands";

const dataOpts = JSON.parse(fs.readFileSync("config/dataOpts.json", "utf8"));
ygoData
    .build(dataOpts, __dirname)
    .then(data => {
        const auth = JSON.parse(fs.readFileSync("config/auth.json", "utf8"));
        const erisOpts: Eris.ClientOptions = { maxShards: "auto" };
        const bot = new Eris.Client(auth.token, erisOpts);
        bot.on("ready", () => {
            console.log("Logged in as %s - %s", bot.user.username, bot.user.id);
        });
        bot.on("messageCreate", msg => {
            // ignore bots
            if (!msg.author.bot) {
                for (const cmd of commands) {
                    for (const name of cmd.names) {
                        if (msg.content.startsWith("." + name)) {
                            const expo: ICommandExpose = {
                                bot,
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
