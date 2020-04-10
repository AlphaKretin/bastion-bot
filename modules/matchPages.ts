import * as Eris from "eris";
import { Card } from "ygopro-data";
import { addReactionButton } from "./bot";
import { generateCardProfile } from "./cardSearch";
import { data } from "./data";
import { PageExtra } from "./Page";
import { canReact, numToEmoji } from "./util";

export const matchPages: { [channelID: string]: CardPage } = {};

interface CardList {
	[id: number]: Card;
}

export function generateCardList(channelID: string): string {
	const page = matchPages[channelID];
	const out: string[] = [];
	const cards = page.getSpan();
	let i = 1;
	const extra = page.extra;
	for (const card of cards) {
		out.push(i + page.index + ". " + card.text[extra.lang].name);
		i++;
	}
	const title = extra.title;
	if (title) {
		out.unshift(title.replace(/%s/g, page.length.toString()) + " (Page " + page.currentPage + "/" + page.maxPage + ")");
	}
	return out.join("\n");
}

let reactionID = 0;

function incrementReactionID(): void {
	const next = (reactionID + 1) % 100;
	reactionID = next;
}

interface MatchExtra {
	lang: string;
	mobile: boolean;
	title?: string;
}

type CardPage = PageExtra<Card, MatchExtra>;

export async function addMatchButtons(msg: Eris.Message): Promise<void> {
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
		const emoji = numToEmoji(ind + 1);
		if (emoji) {
			await addReactionButton(msg, emoji, async mes => {
				const card = cards[ind];
				if (card) {
					const extra = page.extra;
					const [profile] = await generateCardProfile(card, extra.lang, mes, extra.mobile);
					await mes.edit(profile);
				}
			});
		}
	}
}

export async function sendCardList(
	list: CardList,
	lang: string,
	msg: Eris.Message,
	title?: string,
	mobile = false
): Promise<Eris.Message> {
	const hist: number[] = [];
	const origCards: Card[] = Object.values(list);
	const cards: Card[] = [];
	for (let card of origCards) {
		const ids = card.data.aliasedCards;
		// difference < 10: alt art, hide. difference > 10: umi/harpy, allow
		if (Math.abs(card.id - ids[0]) < 10) {
			const tempCard = await data.getCard(ids[0]);
			if (tempCard) {
				card = tempCard;
			}
		}
		if (!hist.includes(card.id) && card.text[lang]) {
			cards.push(card);
			hist.push(card.id);
		}
	}
	const extra: MatchExtra = {
		lang,
		mobile,
		title
	};
	matchPages[msg.channel.id] = new PageExtra<Card, MatchExtra>(msg.author.id, cards, extra);
	const m = await msg.channel.createMessage(generateCardList(msg.channel.id));
	matchPages[msg.channel.id].msg = m;
	if (canReact(m)) {
		await addMatchButtons(m);
	}
	return m;
}
