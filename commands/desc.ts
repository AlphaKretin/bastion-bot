import * as Eris from "eris";
import { Command } from "../modules/Command";
import { addLibraryDescription, libraryPages } from "../modules/libraryPages";

const names: string[] = ["d"];

async function func(msg: Eris.Message): Promise<void> {
	const num = /\d+/.exec(msg.content);
	if (num === null) {
		return;
	}
	const index = parseInt(num[0], 10) - 1;
	const page = libraryPages[msg.channel.id];
	await addLibraryDescription(page, index, msg.channel.id);
}

function cond(msg: Eris.Message): boolean {
	const page = libraryPages[msg.channel.id];
	return msg.channel.id in libraryPages && page !== undefined && page.userID === msg.author.id;
}

const desc = (prefix: string): string =>
	"Shows the description for a given function, constant or parameter from YGOPro's scripts," +
	` from a list being displayed by \`${prefix}f\`, \`${prefix}c\` or \`${prefix}param\`.\n` +
	"Detects edited messages.";

export const command = new Command(names, func, cond, desc, "index", false, false, true);
