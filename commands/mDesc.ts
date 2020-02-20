import * as Eris from "eris";
import { generateCardProfile } from "../modules/cardSearch";
import { Command } from "../modules/Command";
import { matchPages } from "../modules/matchPages";

const names: string[] = ["md", "viewmatch"];

async function func(msg: Eris.Message): Promise<void> {
	const num = /\d+/.exec(msg.content);
	if (num === null) {
		return;
	}
	const index = parseInt(num[0], 10) - 1;
	const page = matchPages[msg.channel.id];
	const cards = page.getSpan();
	const card = cards[index];
	const mes = page.msg;
	const extra = page.extra;
	if (mes && card) {
		const [profile] = await generateCardProfile(card, extra.lang, mes, extra.mobile);
		await mes.edit(profile);
	}
}

function cond(msg: Eris.Message): boolean {
	const page = matchPages[msg.channel.id];
	return msg.channel.id in matchPages && page !== undefined && page.userID === msg.author.id;
}

const desc = (prefix: string): string =>
	"Shows the profile for a given card," +
	` from a list being displayed by \`${prefix}match\` or \`${prefix}search\`.\n` +
	"Detects edited messages.";

export const command = new Command(names, func, cond, desc, "index", false, false, true);
