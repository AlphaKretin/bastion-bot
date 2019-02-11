import * as Eris from "eris";
import { Card } from "ygopro-data";
import { ICardList } from "ygopro-data/dist/module/cards";
import { addReactionButton } from "./bot";
import { sendCardProfile } from "./cardSearch";
import { data } from "./data";
import { Page } from "./Page";
import { numToEmoji } from "./util";

export const matchPages: { [serverID: string]: Page<Card> } = {};

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
