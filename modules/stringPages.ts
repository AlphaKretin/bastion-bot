import { Message } from "eris";
import { addReactionButton } from "./bot";
import { PageExtra } from "./Page";
import { canReact } from "./util";

export const stringPages: { [channelID: string]: StringPage } = {};

export interface StringResult {
	code: string;
	result: string;
	index: number;
}

export function generateStringList(channelID: string): string {
	const page = stringPages[channelID];
	const out: string[] = [];
	const strings = page.getSpan();
	const extra = page.extra;
	for (const string of strings) {
		out.push("`" + string.code + "," + string.index + "`: " + string.result);
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

interface StringExtra {
	lang: string;
	mobile: boolean;
	title?: string;
}

type StringPage = PageExtra<StringResult, StringExtra>;

export async function addstringButtons(msg: Message): Promise<void> {
	const initialID = reactionID;
	const page = stringPages[msg.channel.id];
	if (page.canBack() && reactionID === initialID) {
		await addReactionButton(msg, "⬅", async mes => {
			incrementReactionID();
			page.back(10);
			const out = generateStringList(msg.channel.id);
			await mes.edit(out);
			await mes.removeReactions();
			await addstringButtons(msg);
		});
	}
	if (page.canForward(10) && reactionID === initialID) {
		await addReactionButton(msg, "➡", async mes => {
			incrementReactionID();
			page.forward(10);
			const out = generateStringList(msg.channel.id);
			await mes.edit(out);
			await mes.removeReactions();
			await addstringButtons(msg);
		});
	}
}

export async function sendStringList(
	strings: StringResult[],
	lang: string,
	msg: Message,
	title?: string,
	mobile = false
): Promise<Message> {
	const extra: StringExtra = {
		lang,
		mobile,
		title
	};
	stringPages[msg.channel.id] = new PageExtra<StringResult, StringExtra>(msg.author.id, strings, extra);
	const m = await msg.channel.createMessage(generateStringList(msg.channel.id));
	stringPages[msg.channel.id].msg = m;
	if (canReact(m)) {
		await addstringButtons(m);
	}
	return m;
}
