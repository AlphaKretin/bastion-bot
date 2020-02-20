import * as Eris from "eris";
import { Command } from "../modules/Command";
import { addMatchButtons, generateCardList, matchPages } from "../modules/matchPages";
import { canReact } from "../modules/util";

const names: string[] = ["mp", "matchpage"];

async function func(msg: Eris.Message): Promise<void> {
	const num = /\d+/.exec(msg.content);
	if (num === null) {
		return;
	}
	const pageNumber = parseInt(num[0], 10);
	const page = matchPages[msg.channel.id];
	const curPage = page.currentPage;
	const distance = pageNumber - curPage;
	if (distance > 0) {
		page.forward(distance * 10);
	} else if (distance < 0) {
		page.back(-distance * 10);
	}
	const mes = page.msg;
	if (mes) {
		let out = mes.content;
		if (page.currentPage !== curPage) {
			out = generateCardList(msg.channel.id);
		}
		await mes.edit(out);
		if (canReact(mes)) {
			await mes.removeReactions();
			await addMatchButtons(mes);
		}
	}
}

function cond(msg: Eris.Message): boolean {
	const page = matchPages[msg.channel.id];
	return msg.channel.id in matchPages && page !== undefined && page.userID === msg.author.id;
}

const desc = (prefix: string): string =>
	"Changes the page of card results," +
	` for a list being displayed by \`${prefix}match\` or \`${prefix}search\`.\n` +
	"Detects edited messages.";

export const command = new Command(names, func, cond, desc, undefined, false, false, true);
