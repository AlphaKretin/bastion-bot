import { Message } from "eris";
import { Filter } from "ygopro-data";
import { sendCardProfile } from "../modules/cardSearch";
import { Command } from "../modules/Command";
import { config } from "../modules/configs";
import { data } from "../modules/data";
import { getRandomIntInclusive, trimMsg } from "../modules/util";

const names: string[] = ["randcard", "randomcard"];

async function func(msg: Message, mobile: boolean): Promise<Message | undefined> {
	const content = trimMsg(msg);
	let lang = config.getConfig("defaultLang").getValue(msg);
	for (const term of content.split(/ +/)) {
		if (data.langs.includes(term.toLowerCase())) {
			lang = term.toLowerCase();
		}
	}
	const filter = new Filter(await Filter.parse(content, lang));
	const cards = await data.getCardList();
	const list = filter.filter(cards);
	const ids = Object.keys(list);
	const card = list[Number(ids[getRandomIntInclusive(0, ids.length - 1)])];
	return await sendCardProfile(msg, card, lang, mobile);
}

const desc = (prefix: string): string =>
	"Shows the profile for one random card that meets the given filters.\n" +
	"For details on the filter system, see https://github.com/AlphaKretin/ygo-data/wiki/Filter-system.\n" +
	`For multiple results, try \`${prefix}search |filter\`.`;

export const command = new Command(names, func, undefined, desc, "filter");
