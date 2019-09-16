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
const util_1 = require("./util");
const reactionButtons = {};
const reactionTimeouts = {};
const deleteMessages = {};
const deleteTimers = {};
async function removeButtons(msg) {
    if (msg) {
        delete reactionButtons[msg.id];
        delete reactionTimeouts[msg.id];
        if (util_1.canReact(msg)) {
            await msg.removeReactions();
        }
    }
}
exports.removeButtons = removeButtons;
async function addReactionButton(msg, emoji, func) {
    await msg.addReaction(emoji);
    const button = new ReactionButton_1.ReactionButton(msg, emoji, func);
    if (!(msg.id in reactionButtons)) {
        reactionButtons[msg.id] = {};
    }
    reactionButtons[msg.id][emoji] = button;
    if (!(msg.id in reactionTimeouts)) {
        const time = setTimeout(async () => {
            await removeButtons(msg);
        }, 1000 * 60);
        reactionTimeouts[msg.id] = time;
    }
}
exports.addReactionButton = addReactionButton;
async function logDeleteMessage(sourceMsg, responseMsg) {
    if (!(sourceMsg.id in deleteMessages)) {
        deleteMessages[sourceMsg.id] = [];
    }
    deleteMessages[sourceMsg.id].push(responseMsg);
    if (!(sourceMsg.id in deleteTimers)) {
        const time = setTimeout(async () => {
            delete deleteMessages[sourceMsg.id];
            delete deleteTimers[sourceMsg.id];
        }, 1000 * 60);
        deleteTimers[sourceMsg.id] = time;
    }
}
exports.logDeleteMessage = logDeleteMessage;
const auth = JSON.parse(fs.readFileSync("config/auth.json", "utf8"));
exports.owners = auth.owners;
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
exports.bot.on("messageDelete", async (msg) => {
    if (msg.id in reactionButtons) {
        delete reactionButtons[msg.id];
    }
    if (msg.id in deleteMessages) {
        for (const mes of deleteMessages[msg.id]) {
            await mes.delete();
        }
        delete deleteMessages[msg.id];
    }
});
//# sourceMappingURL=bot.js.map