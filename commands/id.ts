import { Message } from "eris";
import { Command } from "../modules/Command";
import { data } from "../modules/data";
import { getLang } from "../modules/util";

const names = ["id", "code", "passcode"];
const func = async (msg: Message): Promise<Message> => {
	const langs = getLang(msg);
	const card = await data.getCard(langs.msg, langs.lang1);
	if (card) {
		return await msg.channel.createMessage(
			"**" + card.text[langs.lang2].name + "**: " + card.data.aliasedCards.join(" | ")
		);
	} else {
		return await msg.channel.createMessage("Sorry, I can't find a card for `" + langs.msg + "`!");
	}
};

const desc =
	"Searches for a card by ID or name, and shows both without any extra info.\n" +
	"Besides the obvious, useful for quick name translations, since all card searches support language options.";

export const command = new Command(names, func, undefined, desc, "card");
