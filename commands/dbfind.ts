import { Message } from "eris";
import { Command } from "../modules/Command";
import { data } from "../modules/data";
import { getLang } from "../modules/util";

const names = ["dbfind", "database", "cdb"];
const func = async (msg: Message): Promise<Message> => {
	const langs = getLang(msg);
	const card = await data.getCard(langs.msg, langs.lang1);
	if (card) {
		return await msg.channel.createMessage(
			"**" + card.text[langs.lang2].name + "**'s entry can be found in: `" + card.dbs.join(", ") + "`."
		);
	} else {
		return await msg.channel.createMessage("Sorry, I can't find a card for `" + langs.msg + "`!");
	}
};

const desc = "Lists all the YGOPro Databases that Bastion is taking the data for a given card from.";

export const command = new Command(names, func, undefined, desc, "card");
