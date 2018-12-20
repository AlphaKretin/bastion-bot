import * as Eris from "eris";
import { Card } from "ygopro-data";
import { ICardList } from "ygopro-data/dist/module/cards";
import { config } from "./configs";
import { data } from "./data";

export function trimMsg(msg: Eris.Message | string): string {
    const m = msg instanceof Eris.Message ? msg.content : msg;
    return m
        .trim()
        .split(/ +/)
        .slice(1)
        .join(" ");
}

export const getGuildFromMsg = (msg: Eris.Message): Eris.Guild => {
    if (!(msg.channel instanceof Eris.TextChannel)) {
        throw new Error("Config set in DMs!");
    }
    return msg.channel.guild;
};

interface ILangPayload {
    msg: string;
    lang1: string;
    lang2: string;
}

export function getLang(msg: Eris.Message, query?: string): ILangPayload {
    const content = query || trimMsg(msg);
    const terms = content.split(",");
    if (data.langs.includes(terms[terms.length - 1])) {
        if (data.langs.includes(terms[terms.length - 2])) {
            const outM = terms.slice(0, terms.length - 2).join(",");
            return {
                lang1: terms[terms.length - 2],
                lang2: terms[terms.length - 1],
                msg: outM
            };
        } else {
            const outM = terms.slice(0, terms.length - 1).join(",");
            return {
                lang1: terms[terms.length - 1],
                lang2: terms[terms.length - 1],
                msg: outM
            };
        }
    } else {
        const defLang = config.getConfig("defaultLang").getValue(msg);
        return {
            lang1: defLang,
            lang2: defLang,
            msg: content
        };
    }
}

export function getRandomIntInclusive(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function sendCardList(
    list: ICardList,
    lang: string,
    msg: Eris.Message,
    count: number = config.getConfig("listDefault").getValue(msg),
    title?: string
) {
    const out: string[] = [];
    const hist: number[] = [];
    const cards: Card[] = Object.values(list);
    let i = 1;
    let j = 0;
    while (i <= count && j < cards.length) {
        let card = cards[j];
        const ids = await card.aliasIDs;
        if (card.id !== ids[0]) {
            const tempCard = await data.getCard(ids[0]);
            if (tempCard) {
                card = tempCard;
            }
        }
        if (hist.indexOf(card.id) === -1 && card.text[lang]) {
            out.push(i + ". " + card.text[lang].name);
            hist.push(card.id);
            i++;
        }
        j++;
    }
    if (title) {
        out.unshift(title.replace(/%s/g, (i - 1).toString()));
    }
    msg.channel.createMessage(out.join("\n"));
}
