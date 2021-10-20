import { Message } from "eris";
import { Command, REPLACED } from "../modules/Command";
const names = ["link"];
const func = async (msg: Message): Promise<Message> => {
	return msg.channel.createMessage("This has been replaced by `/link`.\n" + REPLACED);
};

const desc = "Superseded by `/link`";

export const command = new Command(names, func, undefined, desc, "name");
