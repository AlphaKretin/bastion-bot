"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Eris = require("eris");
const fs = require("mz/fs");
const auth = JSON.parse(fs.readFileSync("config/auth.json", "utf8"));
const erisOpts = { maxShards: "auto" };
exports.bot = new Eris.Client(auth.token, erisOpts);
exports.bot.on("ready", () => {
    console.log("Logged in as %s - %s", exports.bot.user.username, exports.bot.user.id);
});
//# sourceMappingURL=bot.js.map