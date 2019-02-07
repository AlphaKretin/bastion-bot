import * as Eris from "eris";
import { Command } from "../modules/Command";
import { trimMsg } from "../modules/util";

const names: string[] = ["eval"];

async function go(input: string): Promise<any> {
    // tslint:disable-next-line:no-eval
    eval(input);
}

async function func(msg: Eris.Message) {
    const val = trimMsg(msg);
    const result = await go(val);
    if (result) {
        if (result instanceof Object) {
            return await msg.channel.createMessage("```json\n" + JSON.stringify(result, null, 4) + "```");
        } else {
            return await msg.channel.createMessage(result);
        }
    }
}

export const command = new Command(names, func, undefined, true);
