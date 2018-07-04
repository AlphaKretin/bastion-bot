import * as Eris from "eris";
import * as fs from "fs";

const auth = JSON.parse(fs.readFileSync("auth.json", "utf8"));
const opts: Eris.ClientOptions = {
    disableEvents: {
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
        PRESENCE_UPDATE: true,
        TYPING_START: true,
        USER_UPDATE: true,
        VOICE_STATE_UPDATE: true
    },
    maxShards: "auto"
};
const bot = new Eris.Client(auth.token, opts);
bot.on("ready", () => {
    console.log("Logged in as %s - %s", bot.user.username, bot.user.id);
});
bot.on("messageCreate", msg => {
    console.log("a");
    console.log(msg.content);
    // When a message is created
    if (msg.content === "!ping") {
        // If the message content is "!ping"
        bot.createMessage(msg.channel.id, "Pong!");
        // Send a message in the same channel with "Pong!"
    } else if (msg.content === "!pong") {
        // Otherwise, if the message is "!pong"
        bot.createMessage(msg.channel.id, "Ping!");
        // Respond with "Ping!"
    }
});
bot.connect();
