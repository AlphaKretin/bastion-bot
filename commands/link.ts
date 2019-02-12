import * as Eris from "eris";
import { Command } from "../modules/Command";
import { botOpts } from "../modules/commands";
import { trimMsg } from "../modules/util";
const names = ["link"];
const func = async (msg: Eris.Message) => {
    const content = trimMsg(msg);
    const query = content.toLowerCase().replace(/\s+/g, "");
    const key = Object.keys(botOpts.links).find(k => query.startsWith(k));
    if (key) {
        return msg.channel.createMessage(botOpts.links[key]);
    } else {
        return msg.channel.createMessage(
            "Sorry, I don't have a link with that name. Try one of the following:\n`" +
                Object.keys(botOpts.links).join("`, `") +
                "`"
        );
    }
};

export const cmd = new Command(names, func);
