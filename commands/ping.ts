import * as Eris from "eris";
import { Command } from "../Command";

const names = ["ping"];
const func = (msg: Eris.Message, bot: Eris.Client): Promise<void> => {
    return new Promise((resolve, reject) => {
        bot.createMessage(msg.channel.id, "Pong!")
            .then(() => resolve())
            .catch(e => reject(e));
    });
};

export const cmd = new Command(names, func);
