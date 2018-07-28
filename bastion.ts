import * as octokit from "@octokit/rest";
import * as Eris from "eris";
import * as fs from "mz/fs";
import * as request from "request-promise-native";
import { Driver as ygoData } from "ygopro-data";
import { Command, ICommandExpose } from "./modules/Command";
const GitHub = new octokit();

async function downloadCmd(file: any): Promise<void> {
    const fullPath = "commands/" + file.name;
    const body = await request({
        encoding: null,
        url: file.download_url
    });
    await fs.writeFile(fullPath, body);
}

const botOpts = JSON.parse(fs.readFileSync("config/botOpts.json", "utf8"));
botOpts.cmdRepos.forEach(async (repo: any) => {
    const res = await GitHub.repos.getContent(repo);
    for (const file of res.data) {
        if (file.name.endsWith(".js")) {
            await downloadCmd(file);
        }
    }
});

const commands: Command[] = [];
const files = fs.readdirSync("./commands");
files.forEach(async file => {
    if (file.endsWith(".js")) {
        try {
            const mod = await import("./commands/" + file);
            for (const key in mod) {
                if (mod.hasOwnProperty(key)) {
                    commands.push(mod[key]);
                    console.log("Loaded command " + mod[key].names[0] + "!");
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
});

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
                                commands,
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
