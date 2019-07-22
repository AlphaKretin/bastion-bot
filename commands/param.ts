import * as Eris from "eris";
import { Command } from "../modules/Command";
import { params, sendLibrary } from "../modules/libraryPages";
import { trimMsg } from "../modules/util";

const names: string[] = ["param"];

async function func(msg: Eris.Message) {
    const content = trimMsg(msg);
    const pars = await params.getResults(content);
    if (pars.length > 0) {
        return await sendLibrary(pars, msg);
    }
    return msg.channel.createMessage("Sorry, I couldn't find any params matching `" + content + "`!");
}

const desc = (prefix: string) =>
    "Searches by name for a function parameter from YGOPro Percy scripts, " +
    "and returns a paginated list of all matching results.\n" +
    `Use arrow reactions or \`${prefix}\`p<number> to navigate pages.\n` +
    `Use number reactions or \`${prefix}\`d<number> to show the description for a parameter.`;

export const command = new Command(names, func, undefined, desc, "query");
