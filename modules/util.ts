import * as Eris from "eris";
import request = require("request-promise-native");
import { Card } from "ygopro-data";
import { ICardList } from "ygopro-data/dist/module/cards";
import { addReactionButton } from "./bot";
import { sendCardProfile } from "./cardSearch";
import { config } from "./configs";
import { data } from "./data";
import { Errors } from "./errors";
import { ILibraryData, libraryPages } from "./libraryPages";
import { matchPages, Page } from "./matchPages";

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

function generateLibraryList(serverID: string): string {
    const page = libraryPages[serverID];
    const out: string[] = [];
    const entries = page.getSpan();
    let i = 1;
    const maxLength = Math.max(...entries.map(e => e.variant.length));
    for (const entry of entries) {
        out.push(
            "[" +
                (i + page.index).toString().padStart(2, "0") +
                "] " +
                " ".repeat(maxLength - entry.variant.length) +
                entry.variant +
                " | " +
                entry.name
        );
        i++;
    }
    return "```cs\n" + out.join("\n") + "```\n`" + "Page " + page.currentPage + "/" + page.maxPage + "`";
}

let reactionID = 0;

function incrementReactionID() {
    const next = (reactionID + 1) % 100;
    reactionID = next;
}

async function addMatchButtons(msg: Eris.Message, serverID: string, lang: string, mobile: boolean, title?: string) {
    const initialID = reactionID;
    const page = matchPages[serverID];
    if (page.canBack() && reactionID === initialID) {
        await addReactionButton(msg, "⬅", async mes => {
            incrementReactionID();
            page.back(10);
            const out = generateCardList(serverID, lang, title);
            await mes.edit(out);
            await mes.removeReactions();
            await addMatchButtons(msg, serverID, lang, mobile, title);
        });
    }
    if (page.canForward(10) && reactionID === initialID) {
        await addReactionButton(msg, "➡", async mes => {
            incrementReactionID();
            page.forward(10);
            const out = generateCardList(serverID, lang, title);
            await mes.edit(out);
            await mes.removeReactions();
            await addMatchButtons(msg, serverID, lang, mobile, title);
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

async function addLibraryButtons(msg: Eris.Message, serverID: string) {
    const initialID = reactionID;
    const page = libraryPages[serverID];
    if (page.canBack() && reactionID === initialID) {
        await addReactionButton(msg, "⬅", async mes => {
            incrementReactionID();
            page.back(10);
            const out = generateLibraryList(serverID);
            await mes.edit(out);
            await mes.removeReactions();
            await addLibraryButtons(msg, serverID);
        });
    }
    if (page.canForward(10) && reactionID === initialID) {
        await addReactionButton(msg, "➡", async mes => {
            incrementReactionID();
            page.forward(10);
            const out = generateLibraryList(serverID);
            await mes.edit(out);
            await mes.removeReactions();
            await addLibraryButtons(msg, serverID);
        });
    }
    const entries = page.getSpan();
    for (let ind = 0; ind < Math.min(entries.length, 10); ind++) {
        if (reactionID !== initialID) {
            break;
        }
        await addReactionButton(msg, numToEmoji(ind + 1)!, async mes => {
            await addLibraryDescription(mes, page, ind);
        });
    }
}

async function addLibraryDescription(msg: Eris.Message, page: Page<ILibraryData>, index: number) {
    const entries = page.getSpan();
    const content = msg.content;
    await msg.edit(content + "\n`" + entries[index].desc + "`");
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
        matchPages[serverID] = new Page<Card>(msg.author.id, cards);
        const m = await msg.channel.createMessage(generateCardList(serverID, lang, title));
        await addMatchButtons(m, serverID, lang, mobile, title);
        return m;
    }
}

export async function sendLibrary(list: ILibraryData[], msg: Eris.Message) {
    const chan = msg.channel;
    if (chan instanceof Eris.GuildChannel) {
        const serverID = chan.guild.id;
        libraryPages[serverID] = new Page<ILibraryData>(msg.author.id, list);
        const m = await msg.channel.createMessage(generateLibraryList(serverID));
        await addLibraryButtons(m, serverID);
        return m;
    }
}

export async function getYugipediaPage(query: string): Promise<string> {
    const YUGI_SEARCH =
        "https://yugipedia.com/api.php?action=opensearch&redirects=resolve" +
        "&prop=revisions&rvprop=content&format=json&formatversion=2&search=";
    const fullQuery = YUGI_SEARCH + encodeURIComponent(query);
    try {
        const result = await request(fullQuery);
        const yugiData = JSON.parse(result);
        if (yugiData[3][0]) {
            return yugiData[3][0];
        } else {
            throw new Error(Errors.ERROR_YUGI_API);
        }
    } catch (e) {
        throw new Error(Errors.ERROR_YUGI_API);
    }
}

export async function getYugipediaContent(query: string, prop?: string): Promise<string> {
    const YUGI_API =
        "https://yugipedia.com/api.php?action=query&redirects=true" +
        "&prop=revisions&rvprop=content&format=json&formatversion=2&titles=";
    const fullQuery = YUGI_API + encodeURIComponent(query);
    try {
        const result = await request(fullQuery);
        const yugiData = JSON.parse(result);
        const page = yugiData.query.pages[0].revisions[0].content;
        if (!prop) {
            return page;
        }
        const propReg = new RegExp("\\| " + prop + "\\s+= (.+?)\\n");
        const regRes = propReg.exec(page);
        if (regRes) {
            return regRes[1];
        }
        throw new Error(Errors.ERROR_YUGI_REGEX);
    } catch (e) {
        throw new Error(Errors.ERROR_YUGI_API);
    }
}
