import { Message } from "eris";
import { getMatchingCommands } from "../bastion";
import { Command } from "../modules/Command";
import { config } from "../modules/configs";
import { getLang } from "../modules/util";

const names = ["help"];

const func = async (msg: Message): Promise<Message> => {
	const query = getLang(msg).msg;
	const cmds = getMatchingCommands(msg, query, false).filter(c => c.cmd.isCanExecute(msg));
	const prefix = config.getConfig("prefix").getValue(msg) as string;
	let out = "";
	if (cmds.length > 0) {
		const curCmd = cmds[0].cmd;
		if (curCmd.desc) {
			const desc = typeof curCmd.desc === "string" ? curCmd.desc : curCmd.desc(prefix);
			out = "__**" + prefix + curCmd.names[0] + "**__\n";
			if (curCmd.names.length > 1) {
				out += "(aka " + curCmd.names.slice(1).join(", ") + ")\n";
			}
			if (curCmd.usage) {
				out += "**Usage**: `" + prefix + curCmd.names[0] + " " + curCmd.usage + "`\n";
			}
			out += desc;
			return await msg.channel.createMessage(out);
		} else {
			out = "Sorry, I don't have a description for this command yet! Go yell at AlphaKretin!\n";
		}
	}
	const helpMessage =
		out +
		"I am a Yu-Gi-Oh! card bot made by AlphaKretin#7990.\n" +
		"Price data is from the <https://yugiohprices.com/> API.\n" +
		"My help file is at <https://github.com/AlphaKretin/bastion-bot/>," +
		` or use \`${prefix}commands\` to get a list of commands.\n` +
		`Use \`${prefix}help <commandname>\` to get detailed help on a command.\n` +
		"Support my development on Patreon at <https://www.patreon.com/alphakretinbots>\n" +
		"Invite me to your server! " +
		"<https://discordapp.com/oauth2/authorize?client_id=383854640694820865&scope=bot&permissions=52288>\n";
	return await msg.channel.createMessage(helpMessage);
};

export const command = new Command(
	names,
	func,
	undefined,
	"Provides a general help message if called alone, or the details for the given command.",
	"[command]"
);
