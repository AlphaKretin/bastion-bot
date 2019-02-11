import * as Eris from "eris";
import { Command } from "../modules/Command";
import { constants } from "../modules/libraryPages";
import { sendLibrary, trimMsg } from "../modules/util";

const names: string[] = ["c"];

async function func(msg: Eris.Message) {
    const content = trimMsg(msg);
    const cons = await constants.getResults(content);
    if (cons.length > 0) {
        return await sendLibrary(cons, msg);
    }
    return msg.channel.createMessage("Sorry, I couldn't find any constants matching `" + content + "`!");
}

export const command = new Command(names, func);
