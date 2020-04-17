import { Message } from "eris";
import { Command } from "../modules/Command";
import { data } from "../modules/data";
import { funcLib, constLib, paramLib } from "../modules/libraryPages";
import { skills } from "../modules/skills";

const names: string[] = ["update"];

async function func(msg: Message): Promise<Message> {
	const target = await msg.channel.createMessage("Starting update!");
	try {
		await data.update();
		await target.edit("Cards updating, updating scripting library!");
		await funcLib.update();
		await constLib.update();
		await paramLib.update();
		await skills.update();
		await target.edit("Update complete!");
		return target;
	} catch (e) {
		target.edit("Error!\n" + e.message);
		return target;
	}
}

const desc =
	"pulls down new databases and commands. this is getting overhauled too if you can see this yell at AlphaKretin";

export const command = new Command(names, func, undefined, desc, undefined, false, true);
