import * as Eris from "eris";
import { bot } from "../modules/bot";
import { Command } from "../modules/Command";

const names = ["ping"];
const func = async (msg: Eris.Message): Promise<void> => {
    const time = Date.now();
    const mes = await msg.channel.createMessage("Pong!");
    const ping = new Date(Date.now() - time);
    await mes.edit("Pong! (" + ping.getMilliseconds() + " ms)");
};

export const cmd = new Command(names, func);
