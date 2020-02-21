import * as Eris from "eris";
import { Command } from "../modules/Command";
import { stats } from "../modules/stats";

const names = ["metric"];
const func = async (msg: Eris.Message): Promise<Eris.Message> => {
	const { activeUsers, cardCount, commandCount, cardsPerUser, commandsPerUser } = await stats.getMetrics();
	return await msg.channel.createMessage("I've calculated the following metrics:\n"
    + "**" + activeUsers + " unique users** have searched for cards and/or used commands.\n"
    + "**" + cardCount + " cards** (non-unique) have been searched for.\n"
    + "Each active user has searched an average of **" + cardsPerUser.toFixed(2) + " cards** each.\n"
    + "**" + commandCount + " commands** (non-unique) have been used.\n"
    + "Each active user has used an average of **" + commandsPerUser.toFixed(2) + " commands** each.");
};

const desc = "Fetches various metrics from Bastion's tracked stats.";

export const cmd = new Command(names, func, undefined, desc, undefined, false, true);
