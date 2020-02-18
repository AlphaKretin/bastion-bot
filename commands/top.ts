import * as Eris from "eris";
import { Command } from "../modules/Command";
import { stats } from "../modules/stats";
import { config } from "../modules/configs";
import { trimMsg } from "../modules/util";
import { data } from "../modules/data";

const names = ["top"];

const func = async (msg: Eris.Message): Promise<Eris.Message> => {
	let lang = config.getConfig("defaultLang").getValue(msg);
	const args = trimMsg(msg).split(" ");
	for (const arg of args) {
		if (data.langs.includes(arg)) {
			lang = arg;
		}
	}
	
	// arbitrary limit - fewer isn't interesting enough, more is too big output, finer details can just be queried for by me
	const tops = await stats.topCards(15);
	const lines = [];
	for (let i = 0; i < tops.length; i++) {
		const code = tops[i].result;
		const count = tops[i].times;
		let name = code.toString();
		const card = await data.getCard(code, undefined, true, true);
		if (card && lang in card.text) {
			name = card.text[lang].name;
		}
		lines.push(`${i + 1}. ${name} (${count} times)`);
	}
	return await msg.channel.createMessage("__Top " + lines.length + " card searches__:\n" + lines.join("\n"));
};

const desc = "Displays the cards most popular to search for, up to the top 15.";

export const cmd = new Command(names, func, undefined, desc, "lang");
