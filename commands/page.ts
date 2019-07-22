import * as Eris from "eris";
import { Command } from "../modules/Command";
import { addLibraryButtons, generateLibraryList, libraryPages } from "../modules/libraryPages";

const names: string[] = ["p"];

async function func(msg: Eris.Message) {
    const num = /\d+/.exec(msg.content);
    if (num === null) {
        return;
    }
    const pageNumber = parseInt(num[0], 10);
    const page = libraryPages[msg.channel.id];
    const curPage = page.currentPage;
    const distance = pageNumber - curPage;
    if (distance > 0) {
        page!.forward(distance * 10);
    } else if (distance < 0) {
        page!.back(-distance * 10);
    }
    const mes = page.msg;
    if (mes) {
        let out = mes.content;
        if (page.currentPage !== curPage) {
            out = generateLibraryList(msg.channel.id);
        }
        await mes.edit(out);
        await mes.removeReactions();
        await addLibraryButtons(mes);
    }
}

function cond(msg: Eris.Message) {
    const page = libraryPages[msg.channel.id];
    return msg.channel.id in libraryPages && page !== undefined && page.userID === msg.author.id;
}

const desc = (prefix: string) =>
    "Changes the page of function, constant or parameter results from YGOPro's scripts," +
    ` for a list being displayed by \`${prefix}f\`, \`${prefix}c\` or \`${prefix}param\`.\n` +
    "Detects edited messages.";

export const command = new Command(names, func, cond, desc, "index", undefined, true);
