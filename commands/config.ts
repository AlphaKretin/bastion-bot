import * as Eris from "eris";
import { bot } from "../modules/bot";
import { Command } from "../modules/Command";
import { config } from "../modules/configs";
import { trimMsg } from "../modules/util";

const names: string[] = ["config"];

async function func(msg: Eris.Message) {
    const content = trimMsg(msg);
    const terms = content.split(/ +/);
    const optName = terms[0];
    const val = terms.slice(1).join(" ");
    const opt = config.getConfig(optName);
    opt.setValue(msg, val);
    await msg.channel.createMessage(opt.name + " changed to " + opt.getValue(msg));
}

export const command = new Command(names, func);
