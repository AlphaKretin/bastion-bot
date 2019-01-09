import * as Eris from "eris";
import { Card } from "ygopro-data";
import { ICardList } from "ygopro-data/dist/module/cards";
import { addReactionButton } from "./bot";
import { sendCardProfile } from "./cardSearch";
import { config } from "./configs";
import { data } from "./data";
import { MatchPage, matchPages } from "./matchPages";

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

function generateCardList(serverID: string, lang: string, title?: string): string {
    const page = matchPages[serverID];
    const out: string[] = [];
    const cards = page.getSpan();
    let i = 1;
    for (const card of cards) {
        out.push(i + page.index + ". " + card.text[lang].name);
        i++;
    }
    if (title) {
        out.unshift(
            title.replace(/%s/g, (page.length - 1).toString()) + " (Page " + page.currentPage + "/" + page.maxPage + ")"
        );
    }
    return out.join("\n");
}

let reactionID = 0;

async function addPageButtons(msg: Eris.Message, serverID: string, lang: string, mobile: boolean, title?: string) {
    const initialID = reactionID;
    const page = matchPages[serverID];
    if (page.canBack() && reactionID === initialID) {
        await addReactionButton(msg, "⬅", async mes => {
            reactionID++;
            page.back(10);
            const out = generateCardList(serverID, lang, title);
            await mes.edit(out);
            await mes.removeReactions();
            await addPageButtons(msg, serverID, lang, mobile, title);
        });
    }
    if (page.canForward(10) && reactionID === initialID) {
        await addReactionButton(msg, "➡", async mes => {
            reactionID++;
            page.forward(10);
            const out = generateCardList(serverID, lang, title);
            await mes.edit(out);
            await mes.removeReactions();
            await addPageButtons(msg, serverID, lang, mobile, title);
        });
    }
    const cards = page.getSpan();
    for (let ind = 0; ind < Math.min(cards.length, 10); ind++) {
        if (reactionID !== initialID) {
            break;
        }
        await addReactionButton(msg, numToEmoji(ind + 1)!, async mes => {
            const card = cards[ind];
            if (card) {
                await sendCardProfile(mes, card, lang, mobile, false);
            }
        });
    }
}

export async function sendCardList(
    list: ICardList,
    lang: string,
    msg: Eris.Message,
    title?: string,
    mobile: boolean = false
) {
    const hist: number[] = [];
    const origCards: Card[] = Object.values(list);
    const cards: Card[] = [];
    for (let card of origCards) {
        const ids = await card.aliasIDs;
        if (card.id !== ids[0]) {
            const tempCard = await data.getCard(ids[0]);
            if (tempCard) {
                card = tempCard;
            }
        }
        if (hist.indexOf(card.id) === -1 && card.text[lang]) {
            cards.push(card);
            hist.push(card.id);
        }
    }
    const chan = msg.channel;
    if (chan instanceof Eris.GuildChannel) {
        const serverID = chan.guild.id;
        matchPages[serverID] = new MatchPage(msg.author.id, cards);
        const m = await msg.channel.createMessage(generateCardList(serverID, lang, title));
        await addPageButtons(m, serverID, lang, mobile, title);
    }
}
