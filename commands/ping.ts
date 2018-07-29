import * as Eris from "eris";
import { bot } from "../modules/bot";
import { Command } from "../modules/Command";

const names = ["ping"];
const func = async (msg: Eris.Message): Promise<void> => {
    await bot.createMessage(msg.channel.id, "Pong!");
};

export const cmd = new Command(names, func);
