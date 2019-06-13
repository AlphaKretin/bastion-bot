import * as Eris from "eris";
import { Command } from "../modules/Command";
import { config } from "../modules/configs";

const names = ["help"];

const func = async (msg: Eris.Message) => {
    let helpMessage =
        "I am a Yu-Gi-Oh! card bot made by AlphaKretin#7990.\n" +
        "Price data is from the <https://yugiohprices.com/> API.\n" +
        "My help file is at <https://github.com/AlphaKretin/bastion-bot/>,";
    const prefix = config.getConfig("prefix").getValue(msg);
    helpMessage +=
        ` or use \`${prefix}commands\` to get a list of commands.\n` +
        `Use ${prefix}help <commandname>\` to get detailed help on a command.\n` +
        "Support my development on Patreon at <https://www.patreon.com/alphakretinbots>\n" +
        "Invite me to your server! " +
        "<https://discordapp.com/oauth2/authorize?client_id=383854640694820865&scope=bot&permissions=52288>";
    return await msg.channel.createMessage(helpMessage);
};

export const cmd = new Command(names, func);
