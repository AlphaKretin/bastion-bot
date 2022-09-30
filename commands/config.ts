import { Message } from "eris";
import { Command } from "../modules/Command";
import { config } from "../modules/configs";
import { trimMsg } from "../modules/util";

const names: string[] = ["config"];

async function func(msg: Message): Promise<Message> {
	const content = trimMsg(msg);
	const terms = content.split(/ +/);
	const optName = terms[0];
	const val = terms.slice(1).join(" ");
	if (optName === "fullBrackets") {
		return await msg.channel.createMessage({
			embed: {
				description: "Sorry, please contact us in our [support server](https://discord.gg/GrMGspZ) to change this setting."
			}
		});
	}
	const opt = config.getConfig(optName);
	opt.setValue(msg, val);
	return await msg.channel.createMessage(opt.name + " changed to " + opt.getValue(msg));
}

const desc =
	"Allows moderators to set various per-server options for using Bastion, like the prefix.\n" +
	"See Bastion's documentation for more detail on what you can configure.\n" +
	"https://github.com/AlphaKretin/bastion-bot/wiki/Commands-for-server-mods";
export const command = new Command(names, func, undefined, desc, "option value", true);
