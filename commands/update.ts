import * as Eris from "eris";
import { Command } from "../modules/Command";
import { data } from "../modules/data";

const names: string[] = ["update"];

async function func(msg: Eris.Message) {
    const target = await msg.channel.createMessage("Starting update!");
    try {
        await data.update();
        target.edit("Update complete!");
        return target;
    } catch (e) {
        target.edit("Error!\n" + e.message);
        return target;
    }
}

export const command = new Command(names, func, undefined, undefined, undefined, true);
