import * as Eris from "eris";
import * as fs from "mz/fs";
import { ReactionButton, ReactionFunc } from "./ReactionButton";

const reactionButtons: {
    [messageID: string]: {
        [emoji: string]: ReactionButton;
    };
} = {};
const reactionTimeouts: {
    [messageID: string]: NodeJS.Timer;
} = {};

const deleteMessages: {
    [messageID: string]: Eris.Message[];
} = {};
const deleteTimers: {
    [messageID: string]: NodeJS.Timer;
} = {};

export async function removeButtons(msg: Eris.Message): Promise<void> {
    if (msg) {
        await msg.removeReactions();
        delete reactionButtons[msg.id];
    }
}

export async function addReactionButton(msg: Eris.Message, emoji: string, func: ReactionFunc) {
    await msg.addReaction(emoji);
    const button = new ReactionButton(msg, emoji, func);
    if (!(msg.id in reactionButtons)) {
        reactionButtons[msg.id] = {};
    }
    reactionButtons[msg.id][emoji] = button;
    if (!(msg.id in reactionTimeouts)) {
        const time = setTimeout(async () => {
            await removeButtons(msg);
            delete reactionButtons[msg.id];
            delete reactionTimeouts[msg.id];
        }, 1000 * 60);
        reactionTimeouts[msg.id] = time;
    }
}

export async function logDeleteMessage(sourceMsg: Eris.Message, responseMsg: Eris.Message) {
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

const auth = JSON.parse(fs.readFileSync("config/auth.json", "utf8"));
export const owners: string[] = auth.owners;
const erisOpts: Eris.ClientOptions = { maxShards: "auto" };
export const bot = new Eris.Client(auth.token, erisOpts);
bot.on("ready", () => {
    console.log("Logged in as %s - %s", bot.user.username, bot.user.id);
});

bot.on("messageReactionAdd", async (msg: Eris.PossiblyUncachedMessage, emoji: Eris.Emoji, userID: string) => {
    if (userID === bot.user.id) {
        return;
    }
    if (reactionButtons[msg.id] && reactionButtons[msg.id][emoji.name]) {
        await reactionButtons[msg.id][emoji.name].execute(userID);
    }
});

bot.on("messageDelete", async (msg: Eris.PossiblyUncachedMessage) => {
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
