import * as Eris from "eris";
import { bot } from "./bot";
import { config } from "./configs";
import { data } from "./data";
import { Errors } from "./errors";

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
        throw new Error(Errors.ERROR_CONFIG_DM);
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

export function numToEmoji(n: number): string | undefined {
    if (n > -1 && n < 10) {
        return n.toString() + "\u20e3";
    }
    if (n === 10) {
        return "🔟";
    }
    if (n === 100) {
        return "💯";
    }
}

export function canReact(msg: Eris.Message) {
    const chan = msg.channel;
    if (!(chan instanceof Eris.GuildChannel)) {
        return false;
    }
    const perms = chan.permissionsOf(bot.user.id);
    return perms.has("addReactions") && perms.has("readMessageHistory");
}
