import { Message } from "eris";
import { Command } from "../modules/Command";
import { links } from "../config/botOpts.json";
import { trimMsg } from "../modules/util";
const names = ["link"];
const func = async (msg: Message): Promise<Message> => {
	const content = trimMsg(msg);
	const query = content.toLowerCase().replace(/\s+/g, "");
	const key = Object.keys(links).find(k => query.startsWith(k));
	if (key) {
		// cast links config to dictionary
		return msg.channel.createMessage((links as { [key: string]: string })[key]);
	} else {
		return msg.channel.createMessage(
			"Sorry, I don't have a link with that name. Try one of the following:\n`" + Object.keys(links).join("`, `") + "`"
		);
	}
};

const desc =
	"Recalls one of a variety of useful links, such as common ruling resources.\n" +
	"Call without a link name to see a list of valid names.";

export const command = new Command(names, func, undefined, desc, "name");
