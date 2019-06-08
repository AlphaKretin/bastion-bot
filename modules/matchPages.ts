import * as Eris from "eris";
import { Card } from "ygopro-data";
import { addReactionButton } from "./bot";
import { generateCardProfile } from "./cardSearch";
import { data } from "./data";
import { Page } from "./Page";
import { numToEmoji } from "./util";

export const matchPages: { [channelID: string]: CardPage } = {};

interface ICardList {
    [id: number]: Card;
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
    const extra: IMatchExtra = {
        lang,
        mobile,
        title
    };
    matchPages[msg.channel.id] = new Page<Card, IMatchExtra>(msg.author.id, cards, extra);
    const m = await msg.channel.createMessage(generateCardList(msg.channel.id));
    matchPages[msg.channel.id].msg = m;
    if (!(m.channel instanceof Eris.PrivateChannel)) {
        await addMatchButtons(m);
    }
    return m;
}

export function generateCardList(channelID: string): string {
    const page = matchPages[channelID];
    const out: string[] = [];
    const cards = page.getSpan();
    let i = 1;
    const extra = page.extra!;
    for (const card of cards) {
        out.push(i + page.index + ". " + card.text[extra.lang].name);
        i++;
    }
    const title = extra.title;
    if (title) {
        out.unshift(
            title.replace(/%s/g, page.length.toString()) + " (Page " + page.currentPage + "/" + page.maxPage + ")"
        );
    }
    return out.join("\n");
}

let reactionID = 0;

function incrementReactionID() {
    const next = (reactionID + 1) % 100;
    reactionID = next;
}

interface IMatchExtra {
    lang: string;
    mobile: boolean;
    title?: string;
}

type CardPage = Page<Card, IMatchExtra>;

export async function addMatchButtons(msg: Eris.Message) {
    const initialID = reactionID;
    const page = matchPages[msg.channel.id];
    if (page.canBack() && reactionID === initialID) {
        await addReactionButton(msg, "⬅", async mes => {
            incrementReactionID();
            page.back(10);
            const out = generateCardList(msg.channel.id);
            await mes.edit(out);
            await mes.removeReactions();
            await addMatchButtons(msg);
        });
    }
    if (page.canForward(10) && reactionID === initialID) {
        await addReactionButton(msg, "➡", async mes => {
            incrementReactionID();
            page.forward(10);
            const out = generateCardList(msg.channel.id);
            await mes.edit(out);
            await mes.removeReactions();
            await addMatchButtons(msg);
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
                const extra = page.extra!;
                const [profile] = await generateCardProfile(card, extra.lang, mes, extra.mobile);
                await mes.edit(profile);
            }
        });
    }
}
