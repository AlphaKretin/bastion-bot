import * as Eris from "eris";
import { Card } from "../node_modules/ygopro-data/dist/Card";
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

export const getGuildFromMsg = (msg: Eris.Message): Eris.Guild | undefined =>
    msg.channel instanceof Eris.TextChannel ? msg.channel.guild : undefined;

interface ILangPayload {
    msg: string;
    lang1: string;
    lang2: string;
}

export function getLang(msg: Eris.Message): ILangPayload {
    const content = trimMsg(msg);
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

function isILangPayload(arg: any): arg is ILangPayload {
    return arg.msg !== undefined;
}

export async function getCardInLang(query: ILangPayload) {
    try {
        const card = await data.getCard(query.msg, query.lang1);
        if (card && query.lang2 !== query.lang1) {
            return await data.getCard(card.code, query.lang2);
        }
        return card;
    } catch (e) {
        throw e;
    }
}
