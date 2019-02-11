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

export const command = new Command(names, func);
