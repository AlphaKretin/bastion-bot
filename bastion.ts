import * as octokit from "@octokit/rest";
import * as Eris from "eris";
import * as fs from "fs";
import * as request from "request";
import { Driver as ygoData } from "ygopro-data";
import { Command } from "./Command";
const GitHub = new octokit();

function downloadCmd(file: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const fullPath = "commands/" + file.name;
        request(
            {
                encoding: null,
                url: file.download_url
            },
            (er: Error, _: any, body: Buffer) => {
                if (er) {
                    reject(er);
                } else {
                    fs.writeFile(fullPath, body, e => {
                        if (e) {
                            reject(e);
                        } else {
                            resolve();
                        }
                    });
                }
            }
        );
    });
}

const botOpts = JSON.parse(fs.readFileSync("config/botOpts.json", "utf8"));
const promises: Array<Promise<void>> = [];
for (const repo of botOpts.cmdRepos) {
    GitHub.repos
        .getContent(repo)
        .then(res => {
            for (const key in res.data) {
                if (res.data.hasOwnProperty(key)) {
                    const file = res.data[key];
                    if (file.name.endsWith(".js")) {
                        promises.push(downloadCmd(file));
                    }
                }
            }
        })
        .catch(e => console.error(e));
}
Promise.all(promises)
    .then(() => {
        const commands: Command[] = [];
        fs.readdir("./commands", (err, files) => {
            if (err) {
                console.error(err);
                process.exit();
            } else {
                for (const file of files) {
                    if (file.endsWith(".js")) {
                        try {
                            const mod: any = require("./commands/" + file);
                            if (mod.cmd && mod.cmd instanceof Command) {
                                commands.push(mod.cmd);
                                console.log("Loaded command " + file + "!");
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            }
        });

        const dataOpts = JSON.parse(fs.readFileSync("config/dataOpts.json", "utf8"));
        ygoData
            .build(dataOpts, __dirname)
            .then(data => {
                const auth = JSON.parse(fs.readFileSync("config/auth.json", "utf8"));
                const erisOpts: Eris.ClientOptions = {
                    /*disableEvents: { // This breaks the bot, figure it out later
                        CHANNEL_CREATE: true,
                        CHANNEL_DELETE: true,
                        CHANNEL_UPDATE: true,
                        GUILD_BAN_ADD: true,
                        GUILD_BAN_REMOVE: true,
                        GUILD_CREATE: true,
                        GUILD_DELETE: true,
                        GUILD_MEMBER_ADD: true,
                        GUILD_MEMBER_REMOVE: true,
                        GUILD_MEMBER_UPDATE: true,
                        GUILD_ROLE_CREATE: true,
                        GUILD_ROLE_DELETE: true,
                        GUILD_ROLE_UPDATE: true,
                        GUILD_UPDATE: true,
                        MESSAGE_CREATE: false,
                        MESSAGE_DELETE: false,
                        MESSAGE_DELETE_BULK: false,
                        MESSAGE_UPDATE: false,
                        PRESENCE_UPDATE: true,
                        TYPING_START: true,
                        USER_UPDATE: true,
                        VOICE_STATE_UPDATE: true
                    },*/
                    maxShards: "auto"
                };
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
                                    cmd.execute(msg, bot).catch(e => bot.createMessage(msg.channel.id, "Error!\n" + e));
                                    return;
                                }
                            }
                        }
                        const re = /{(.+)}/g;
                        const result = re.exec(msg.content);
                        if (result) {
                            result.forEach((res, i) => {
                                // ignore full match
                                if (i > 0) {
                                    data.getCard(res, "en")
                                        .then(card => {
                                            bot.createMessage(msg.channel.id, card.name);
                                        })
                                        .catch(e => console.error(e));
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
    })
    .catch(e => {
        console.error(e);
        process.exit();
    });
