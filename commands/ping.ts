import { Message } from "eris";
import { Command } from "../modules/Command";

const names = ["ping"];
const func = async (msg: Message): Promise<Message> => {
	const time = Date.now();
	const mes = await msg.channel.createMessage("Pong!");
	const ping = new Date(Date.now() - time);
	await mes.edit("Pong! (" + ping.getMilliseconds() + " ms)");
	return mes;
};

const desc = "Sends a basic reply to test connectivity, and notes how long it took.";

export const command = new Command(names, func, undefined, desc);
