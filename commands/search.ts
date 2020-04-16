import { Message, PrivateChannel } from "eris";
import { Card, enums, Filter } from "ygopro-data";
import { Command } from "../modules/Command";
import { config } from "../modules/configs";
import { data } from "../modules/data";
import { sendCardList } from "../modules/matchPages";
import { trimMsg } from "../modules/util";

const names: string[] = ["search", "textsearch"];

async function func(msg: Message, mobile: boolean): Promise<Message> {
	const content = trimMsg(msg);
	const a = content.split("|");
	const query = a[0].trim().toLowerCase();
	const filterText = a[1];
	let lang = config.getConfig("defaultLang").getValue(msg);
	if (filterText) {
		for (const term of filterText.split(/ +/)) {
			if (data.langs.includes(term.toLowerCase())) {
				lang = term.toLowerCase();
			}
		}
	}
	let cards: Card[] = [];
	const fullList = await data.getCardList();
	for (const code in fullList) {
		const text = fullList[code].text[lang];
		if (
			text &&
			(text.name.toLowerCase().includes(query) ||
				text.desc.monsterBody.toLowerCase().includes(query) ||
				(text.desc.pendBody && text.desc.pendBody.toLowerCase().includes(query)))
		) {
			cards.push(fullList[code]);
		}
	}
	if (filterText) {
		const filter = new Filter(await Filter.parse(filterText, lang));
		cards = filter.filter(cards);
	}
	const isDM = msg.channel instanceof PrivateChannel; // allow anime in DMs because no way to turn it on
	const allowAnime = isDM || config.getConfig("allowAnime").getValue(msg);
	const allowCustom = isDM || config.getConfig("allowAnime").getValue(msg);
	if (cards.length > 0) {
		if (!allowAnime) {
			cards = cards.filter(
				c =>
					!(c.data.isOT(enums.ot.OT_ANIME) || c.data.isOT(enums.ot.OT_ILLEGAL) || c.data.isOT(enums.ot.OT_VIDEO_GAME))
			);
		}
		if (!allowCustom) {
			cards = cards.filter(c => !c.data.isOT(enums.ot.OT_CUSTOM));
		}
		if (cards.length > 0) {
			return await sendCardList(cards, lang, msg, "Top %s card text matches for `" + query + "`:", mobile);
		}
	}
	return await msg.channel.createMessage("Sorry, I couldn't find any cards matching the text `" + query + "`!");
}

const desc = (prefix: string): string =>
	"Searches for cards by exact match in the card name and/or text, " +
	"and returns a paginated list of all results.\n" +
	`Use arrow reactions or \`${prefix}\`mp<number> to navigate pages.\n` +
	`Use number reactions or \`${prefix}\`md<number> to show the profile for a card.\n` +
	"For details on the filter system, see https://github.com/AlphaKretin/ygo-data/wiki/Filter-system.";

export const command = new Command(names, func, undefined, desc, "query|filter");
