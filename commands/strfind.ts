import { Message } from "eris";
import { Command } from "../modules/Command";
import { config } from "../modules/configs";
import { data } from "../modules/data";
import { trimMsg } from "../modules/util";
import { sendStringList, StringResult } from "../modules/stringPages";

const names: string[] = ["strfind", "strsearch", "stringfind", "stringsearch", "findstr", "searchstr"];

async function func(msg: Message, mobile: boolean): Promise<Message> {
	const content = trimMsg(msg);
	const a = content.split("|");
	const query = a[0].trim().toLowerCase();
	const maybeLang = a[1] && a[1].trim().toLowerCase();
	let lang = config.getConfig("defaultLang").getValue(msg);
	if (maybeLang) {
		if (data.langs.includes(maybeLang)) {
			lang = maybeLang;
		}
	}
	const results: StringResult[] = [];
	const fullList = await data.getCardList();
	for (const code in fullList) {
		const text = fullList[code].text[lang];
		const matches = text && text.strings.filter(s => s.toLowerCase().includes(query));
		if (matches && matches.length > 0) {
			for (const result of matches) {
				const index = text.strings.indexOf(result);
				results.push({
					code,
					result,
					index
				});
			}
		}
	}
	if (results.length > 0) {
		return await sendStringList(results, lang, msg, "%s string matches for `" + query + "`:", mobile);
	}
	return await msg.channel.createMessage("Sorry, I couldn't find any strings matching the text `" + query + "`!");
}

const desc = (prefix: string): string =>
	"Searches for EDOPro card strings and returns a paginated list of all results.\n" +
	`Use arrow reactions or \`${prefix}\`sp<number> to navigate pages.`;

export const command = new Command(names, func, undefined, desc, "query|filter");
