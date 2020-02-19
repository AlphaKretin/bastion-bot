import * as Eris from "eris";
import { Command } from "../modules/Command";
import { trimMsg } from "../modules/util";
import { skills } from "../modules/skills";
import { config } from "../modules/configs";

const names = ["skill"];
const func = async (msg: Eris.Message, mobile: boolean): Promise<Eris.Message> => {
	const content = trimMsg(msg);
	const skill = await skills.getSkill(content);
	if (!skill) {
		return await msg.channel.createMessage("Sorry, I could not find a Skill with a name like `" + content + "`! For a Speed Duel Skill, try a normal card search.");
	}
	if (mobile) {
		return await msg.channel.createMessage("__**" + skill.name + "**__\n**Effect**: " + skill.name + "\n**Characters**: " + skill.chars);
	}
	const out: Eris.MessageContent = {
		embed: {
			title: skill.name,
			color: config.getConfig("embedColor").getValue(msg),
			fields: [
				{
					name: "Effect",
					value: skill.desc
				},
				{
					name: "Characters",
					value: skill.chars
				}
			]
		}
	};
	return await msg.channel.createMessage(out);
};

const desc = "Searches for a Duel Links skill by name and returns details about it. For a Speed Duel skill, try a normal card search.";

export const cmd = new Command(names, func, undefined, desc, "name");
