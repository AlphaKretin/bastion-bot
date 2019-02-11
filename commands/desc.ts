import * as Eris from "eris";
import { Command } from "../modules/Command";
import { libraryPages } from "../modules/libraryPages";
import { addLibraryDescription, trimMsg } from "../modules/util";

const names: string[] = ["d"];

async function func(msg: Eris.Message) {
    const num = /\d+/.exec(msg.content);
    if (num === null) {
        return;
    }
    const index = parseInt(num[0], 10) - 1;
    const chan = msg.channel;
    if (!(chan instanceof Eris.GuildChannel)) {
        return;
    }
    const guild = chan.guild;
    const page = libraryPages[guild.id];
    await addLibraryDescription(page, index, guild.id);
}

function cond(msg: Eris.Message) {
    const chan = msg.channel;
    if (!(chan instanceof Eris.GuildChannel)) {
        return false;
    }
    const guild = chan.guild;
    const page = libraryPages[guild.id];
    return guild.id in libraryPages && page !== undefined && page.userID === msg.author.id;
}

export const command = new Command(names, func, cond, undefined, true);
