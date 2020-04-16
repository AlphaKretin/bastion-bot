import { Message } from "eris";
import { Command } from "../modules/Command";
import { constLib, sendLibrary } from "../modules/libraryPages";
import { trimMsg } from "../modules/util";

const names: string[] = ["c"];

async function func(msg: Message): Promise<Message> {
	const content = trimMsg(msg);
	const cons = await constLib.getResults(content);
	if (cons.length > 0) {
		return await sendLibrary(cons, msg);
	}
	return msg.channel.createMessage("Sorry, I couldn't find any constants matching `" + content + "`!");
}

const desc = (prefix: string): string =>
	"Searches by name for a constant from YGOPro Percy scripts, " +
	"and returns a paginated list of all matching results.\n" +
	`Use arrow reactions or \`${prefix}p<number>\` to navigate pages.\n` +
	`Use number reactions or \`${prefix}d<number>\` to show the description for a constant.`;

export const command = new Command(names, func, undefined, desc, "query");
