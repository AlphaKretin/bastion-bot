import { Message } from "eris";
import { Command, REPLACED } from "../modules/Command";

const names = ["yugi", "pedia", "wiki"];
const func = async (msg: Message): Promise<Message> => {
	return msg.channel.createMessage("This has been replaced by `/yugipedia`." + REPLACED);
};

const desc = "Superseded by `/yugipedia`";

export const command = new Command(names, func, undefined, desc, "page");
