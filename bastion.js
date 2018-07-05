"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Eris = require("eris");
const fs = require("fs");
const ygopro_data_1 = require("ygopro-data");
const dataOpts = JSON.parse(fs.readFileSync("config/dataOpts.json", "utf8"));
ygopro_data_1.Driver
    .build(dataOpts, __dirname)
    .then(data => {
    const auth = JSON.parse(fs.readFileSync("config/auth.json", "utf8"));
    const erisOpts = {
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
//# sourceMappingURL=bastion.js.map