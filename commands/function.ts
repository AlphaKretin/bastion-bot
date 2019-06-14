import * as Eris from "eris";
import { Command } from "../modules/Command";
import { functions, sendLibrary } from "../modules/libraryPages";
import { trimMsg } from "../modules/util";

const names: string[] = ["f"];

async function func(msg: Eris.Message) {
    const content = trimMsg(msg);
    const funcs = await functions.getResults(content);
    if (funcs.length > 0) {
        return await sendLibrary(funcs, msg);
    }
    return msg.channel.createMessage("Sorry, I couldn't find any functions matching `" + content + "`!");
}

const desc = (prefix: string) =>
    "Searches by name for a function from YGOPro Percy scripts, " +
    "and returns a paginated list of all matching results.\n" +
    `Use arrow reactions or \`${prefix}\`p<number> to navigate pages.\n` +
    `Use number reactions or \`${prefix}\`d<number> to show the description for a function.`;

export const command = new Command(names, func, undefined, desc, "query");
