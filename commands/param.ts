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

export const command = new Command(names, func);
