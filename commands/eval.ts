import * as Eris from "eris";
import * as util from "util";
import { Command } from "../modules/Command";
import { data } from "../modules/data";
import { trimMsg } from "../modules/util";

// make import used so it's not optimised out
function butts() {
    return data;
}

const names: string[] = ["eval"];

async function go(input: string): Promise<any> {
    // tslint:disable-next-line:no-eval
    eval(input);
}

async function func(msg: Eris.Message) {
    const val = trimMsg(msg);
    let evaled;
    try {
        // tslint:disable-next-line:no-eval
        evaled = await eval(val);
    } catch (e) {
        evaled = e;
    }
    const output = util.inspect(evaled, true, 5, false);
    return await msg.channel.createMessage("```json\n" + output + "```");
}

export const command = new Command(names, func, undefined, undefined, undefined, true);
