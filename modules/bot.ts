import { Message, ClientOptions, Client, PossiblyUncachedMessage, Emoji } from "eris";
import { token } from "../config/auth.json";
import { ReactionButton, ReactionFunc } from "./ReactionButton";
import { canReact } from "./util";

const reactionButtons: {
	[messageID: string]: {
		[emoji: string]: ReactionButton;
	};
} = {};
const reactionTimeouts: {
	[messageID: string]: NodeJS.Timer;
} = {};

const deleteMessages: {
	[messageID: string]: Message[];
} = {};
const deleteTimers: {
	[messageID: string]: NodeJS.Timer;
} = {};

export async function removeButtons(msg: Message): Promise<void> {
	if (msg) {
		delete reactionButtons[msg.id];
		delete reactionTimeouts[msg.id];
		if (canReact(msg)) {
			await msg.removeReactions();
		}
	}
}

export async function addReactionButton(msg: Message, emoji: string, func: ReactionFunc): Promise<void> {
	await msg.addReaction(emoji);
	const button = new ReactionButton(msg, emoji, func);
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

export function logDeleteMessage(sourceMsg: Message, responseMsg: Message): void {
	if (!(sourceMsg.id in deleteMessages)) {
		deleteMessages[sourceMsg.id] = [];
	}
	deleteMessages[sourceMsg.id].push(responseMsg);
	if (!(sourceMsg.id in deleteTimers)) {
		const time = setTimeout(() => {
			delete deleteMessages[sourceMsg.id];
			delete deleteTimers[sourceMsg.id];
		}, 1000 * 60);
		deleteTimers[sourceMsg.id] = time;
	}
}

const erisOpts: ClientOptions = { maxShards: "auto" };
export const bot = new Client(token, erisOpts);
bot.on("ready", () => {
	console.log("Logged in as %s - %s", bot.user.username, bot.user.id);
});

bot.on("messageReactionAdd", async (msg: PossiblyUncachedMessage, emoji: Emoji, userID: string) => {
	if (userID === bot.user.id) {
		return;
	}
	if (reactionButtons[msg.id] && reactionButtons[msg.id][emoji.name]) {
		await reactionButtons[msg.id][emoji.name].execute(userID);
	}
});

bot.on("messageDelete", async (msg: PossiblyUncachedMessage) => {
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
