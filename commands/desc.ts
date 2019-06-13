import * as Eris from "eris";
import { Command } from "../modules/Command";
import { addLibraryDescription, libraryPages } from "../modules/libraryPages";

const names: string[] = ["d"];

async function func(msg: Eris.Message) {
    const num = /\d+/.exec(msg.content);
    if (num === null) {
        return;
    }
    const index = parseInt(num[0], 10) - 1;
    const page = libraryPages[msg.channel.id];
    await addLibraryDescription(page, index, msg.channel.id);
}

function cond(msg: Eris.Message) {
    const page = libraryPages[msg.channel.id];
    return msg.channel.id in libraryPages && page !== undefined && page.userID === msg.author.id;
}

export const command = new Command(names, func, cond, undefined, undefined, undefined, true);
