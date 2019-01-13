"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Eris = __importStar(require("eris"));
const fs = __importStar(require("mz/fs"));
const ReactionButton_1 = require("./ReactionButton");
const reactionButtons = {};
const reactionTimeouts = {};
async function removeButtons(msg) {
    if (msg) {
        await msg.removeReactions();
        delete reactionButtons[msg.id];
    }
}
exports.removeButtons = removeButtons;
async function addReactionButton(msg, emoji, func) {
    try {
        await msg.addReaction(emoji);
        const button = new ReactionButton_1.ReactionButton(msg, emoji, func);
        if (!(msg.id in reactionButtons)) {
            reactionButtons[msg.id] = {};
        }
        reactionButtons[msg.id][emoji] = button;
        if (!(msg.id in reactionTimeouts)) {
            const time = setTimeout(async () => {
                await removeButtons(msg);
                delete reactionTimeouts[msg.id];
            }, 1000 * 60);
            reactionTimeouts[msg.id] = time;
        }
    }
    catch (e) {
        console.error(e);
    }
}
exports.addReactionButton = addReactionButton;
const auth = JSON.parse(fs.readFileSync("config/auth.json", "utf8"));
const erisOpts = { maxShards: "auto" };
exports.bot = new Eris.Client(auth.token, erisOpts);
exports.bot.on("ready", () => {
    console.log("Logged in as %s - %s", exports.bot.user.username, exports.bot.user.id);
});
exports.bot.on("messageReactionAdd", async (msg, emoji, userID) => {
    if (userID === exports.bot.user.id) {
        return;
    }
    if (reactionButtons[msg.id] && reactionButtons[msg.id][emoji.name]) {
        await reactionButtons[msg.id][emoji.name].execute(userID);
    }
});
exports.bot.on("messageDelete", (msg) => {
    if (reactionButtons[msg.id]) {
        delete reactionButtons[msg.id];
    }
});
//# sourceMappingURL=bot.js.map