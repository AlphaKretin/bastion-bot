"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const octokit = require("@octokit/rest");
const Eris = require("eris");
const fs = require("mz/fs");
const request = require("request-promise-native");
const ygopro_data_1 = require("ygopro-data");
const GitHub = new octokit();
async function downloadCmd(file) {
    const fullPath = "commands/" + file.name;
    const body = await request({
        encoding: null,
        url: file.download_url
    });
    await fs.writeFile(fullPath, body);
}
const botOpts = JSON.parse(fs.readFileSync("config/botOpts.json", "utf8"));
botOpts.cmdRepos.forEach(async (repo) => {
    const res = await GitHub.repos.getContent(repo);
    for (const file of res.data) {
        if (file.name.endsWith(".js")) {
            await downloadCmd(file);
        }
    }
});
const commands = [];
const files = fs.readdirSync("./commands");
files.forEach(async (file) => {
    if (file.endsWith(".js")) {
        try {
            const mod = await Promise.resolve().then(() => require("./commands/" + file));
            for (const key in mod) {
                if (mod.hasOwnProperty(key)) {
                    commands.push(mod[key]);
                    console.log("Loaded command " + mod[key].names[0] + "!");
                }
            }
        }
        catch (e) {
            console.error(e);
        }
    }
});
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
            for (const cmd of commands) {
                for (const name of cmd.names) {
                    if (msg.content.startsWith("." + name)) {
                        const expo = {
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
//# sourceMappingURL=bastion.js.map