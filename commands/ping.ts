import * as Eris from "eris";
import { Command, ICommandExpose } from "../Command";

const names = ["ping"];
const func = (msg: Eris.Message, data: ICommandExpose): Promise<void> => {
    return new Promise((resolve, reject) => {
        data.bot
            .createMessage(msg.channel.id, "Pong!")
            .then(() => resolve())
            .catch(e => reject(e));
    });
};

export const cmd = new Command(names, func);
