import * as Eris from "eris";
import { generateCardProfile } from "../modules/cardSearch";
import { Command } from "../modules/Command";
import { matchPages } from "../modules/matchPages";

const names: string[] = ["md", "viewmatch"];

async function func(msg: Eris.Message) {
    const num = /\d+/.exec(msg.content);
    if (num === null) {
        return;
    }
    const index = parseInt(num[0], 10) - 1;
    const page = matchPages[msg.channel.id];
    const cards = page.getSpan();
    const card = cards[index];
    const mes = page.msg;
    const extra = page.extra!;
    if (mes && card) {
        const [profile] = await generateCardProfile(card, extra.lang, mes, extra.mobile);
        await mes.edit(profile);
    }
}

function cond(msg: Eris.Message) {
    const page = matchPages[msg.channel.id];
    return msg.channel.id in matchPages && page !== undefined && page.userID === msg.author.id;
}

export const command = new Command(names, func, cond, undefined, true);
