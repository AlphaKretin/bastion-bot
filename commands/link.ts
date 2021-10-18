import { Message } from "eris";
import { Command } from "../modules/Command";
const names = ["link"];
const func = async (msg: Message): Promise<Message> => {
	return msg.channel.createMessage("This has been replaced by `/link`, a Slash Command that is part of a new Bastion update.");
};

const desc = "Superseded by `/link`";

export const command = new Command(names, func, undefined, desc, "name");
