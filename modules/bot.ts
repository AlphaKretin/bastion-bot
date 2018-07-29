import * as Eris from "eris";
import * as fs from "mz/fs";

const auth = JSON.parse(fs.readFileSync("config/auth.json", "utf8"));
const erisOpts: Eris.ClientOptions = { maxShards: "auto" };
export const bot = new Eris.Client(auth.token, erisOpts);
bot.on("ready", () => {
    console.log("Logged in as %s - %s", bot.user.username, bot.user.id);
});
