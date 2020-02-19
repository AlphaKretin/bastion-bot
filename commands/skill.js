"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const util_1 = require("../modules/util");
const skills_1 = require("../modules/skills");
const configs_1 = require("../modules/configs");
const names = ["skill"];
const func = async (msg, mobile) => {
    const content = util_1.trimMsg(msg);
    const skill = await skills_1.skills.getSkill(content);
    if (!skill) {
        return await msg.channel.createMessage("Sorry, I could not find a Skill with a name like `" + content + "`! For a Speed Duel Skill, try a normal card search.");
    }
    if (mobile) {
        return await msg.channel.createMessage("__**" + skill.name + "**__\n**Effect**: " + skill.name + "\n**Characters**: " + skill.chars);
    }
    const out = {
        embed: {
            title: skill.name,
            color: configs_1.config.getConfig("embedColor").getValue(msg),
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
exports.cmd = new Command_1.Command(names, func, undefined, desc, "name");
//# sourceMappingURL=skill.js.map