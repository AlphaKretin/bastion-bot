import { Message } from "eris";
import { Command } from "../modules/Command";
import { stats } from "../modules/stats";
import { bot } from "../modules/bot";

const names = ["metric"];
const func = async (msg: Message): Promise<Message> => {
	const { activeUsers, cardCount, commandCount, cardsPerUser, commandsPerUser } = await stats.getMetrics();
	const serverCount = bot.guilds.size;
	const userCount = bot.users.size;
	return await msg.channel.createMessage(
		"I've calculated the following metrics:\n" +
			"I am in **" +
			serverCount +
			" servers**.\n" +
			"**" +
			userCount +
			" users** share a server with me.\n" +
			"**" +
			activeUsers +
			" unique users** have searched for cards and/or used commands.\n" +
			"**" +
			cardCount +
			" cards** (non-unique) have been searched for.\n" +
			"Each active user has searched an average of **" +
			cardsPerUser.toFixed(2) +
			" cards** each.\n" +
			"**" +
			commandCount +
			" commands** (non-unique) have been used.\n" +
			"Each active user has used an average of **" +
			commandsPerUser.toFixed(2) +
			" commands** each."
	);
};

const desc = "Fetches various metrics from Bastion's tracked stats.";

export const command = new Command(names, func, undefined, desc, undefined, false, true);
