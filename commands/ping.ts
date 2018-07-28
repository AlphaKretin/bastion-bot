import * as Eris from "eris";
import { Command, ICommandExpose } from "../Command";

const names = ["ping"];
const func = async (msg: Eris.Message, data: ICommandExpose): Promise<void> => {
    await data.bot.createMessage(msg.channel.id, "Pong!");
};

export const cmd = new Command(names, func);
