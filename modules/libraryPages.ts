import { Message } from "eris";
import { addReactionButton } from "./bot";
import { PageSimple } from "./Page";
import { canReact, numToEmoji } from "./util";
import { functions, constants, params } from "../config/sheetOpts.json";
import { default as parse } from "csv-parse";
import fetch from "node-fetch";

export interface LibraryData {
	variant: string; // type signature for functions, value for constants, type for parameters
	name: string;
	desc: string | undefined;
}

export type CSVResult = string[][];

export type LibraryPage = PageSimple<LibraryData>;
export const libraryPages: { [channelID: string]: LibraryPage } = {};

class Library {
	private lib?: Promise<LibraryData[]>;
	private source: string;

	constructor(spreadsheetId: string) {
		this.source = spreadsheetId;
		this.update();
	}

	public async getResults(query: string): Promise<LibraryData[]> {
		const out: LibraryData[] = [];
		if (!this.lib) {
			throw new Error("Scripting library not yet loaded! Please wait.");
		}
		const library = await this.lib;
		const term = query.toLowerCase();
		for (const libEntry of library) {
			if (libEntry.name.toLowerCase().split("(")[0].includes(term)) {
				out.push(libEntry);
			}
		}
		return out;
	}

	public update(): Promise<LibraryData[]> {
		return (this.lib = this.load());
	}

	private async extract(url: string): Promise<CSVResult> {
		const file = await fetch(url);
		const csv = await file.text();
		const data = await new Promise<CSVResult>((resolve, reject) => {
			parse(csv, (err, data: CSVResult) => {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
		return data;
	}

	private async load(): Promise<LibraryData[]> {
		const data = await this.extract(this.source);
		const sheet = Object.values(data).filter((s, i) => i > 0 && s.length > 0); // skip header row
		if (sheet.length === 0) {
			throw new Error("Sheet does not conform to Functions, Constants or Params!");
		}
		const out: LibraryData[] = sheet.map(row => ({ variant: row[0], name: row[1], desc: row[2] }));
		return out;
	}
}

export const funcLib = new Library(functions);
export const constLib = new Library(constants);
export const paramLib = new Library(params);

export function generateLibraryList(channelID: string): string {
	const page = libraryPages[channelID];
	const out: string[] = [];
	const entries = page.getSpan();
	let i = 1;
	const maxLength = Math.max(...entries.map(e => e.variant.length));
	const digitLength = (page.index + 10).toString().length;
	for (const entry of entries) {
		out.push(
			"[" +
				(i + page.index).toString().padStart(digitLength, "0") +
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

function incrementReactionID(): void {
	const next = (reactionID + 1) % 100;
	reactionID = next;
}

export async function addLibraryDescription(
	page: PageSimple<LibraryData>,
	index: number,
	channelID: string
): Promise<void> {
	const entries = page.getSpan();
	if (!(index in entries && page.msg)) {
		return;
	}
	const desc = entries[index].desc || "Sorry, I don't have a description for this!";
	await page.msg.edit(generateLibraryList(channelID) + "\n`" + desc + "`");
}

export async function addLibraryButtons(msg: Message): Promise<void> {
	const initialID = reactionID;
	const page = libraryPages[msg.channel.id];
	if (page.canBack() && reactionID === initialID) {
		await addReactionButton(msg, "⬅", async mes => {
			incrementReactionID();
			page.back(10);
			const out = generateLibraryList(msg.channel.id);
			await mes.edit(out);
			await mes.removeReactions();
			await addLibraryButtons(msg);
		});
	}
	if (page.canForward(10) && reactionID === initialID) {
		await addReactionButton(msg, "➡", async mes => {
			incrementReactionID();
			page.forward(10);
			const out = generateLibraryList(msg.channel.id);
			await mes.edit(out);
			await mes.removeReactions();
			await addLibraryButtons(msg);
		});
	}
	const entries = page.getSpan();
	for (let ind = 0; ind < Math.min(entries.length, 10); ind++) {
		if (reactionID !== initialID) {
			break;
		}
		const emoji = numToEmoji(ind + 1);
		if (emoji) {
			await addReactionButton(msg, emoji, async () => {
				await addLibraryDescription(page, ind, msg.channel.id);
			});
		}
	}
}

export async function sendLibrary(list: LibraryData[], msg: Message): Promise<Message> {
	libraryPages[msg.channel.id] = new PageSimple<LibraryData>(msg.author.id, list);
	const m = await msg.channel.createMessage(generateLibraryList(msg.channel.id));
	libraryPages[msg.channel.id].msg = m;
	if (canReact(m)) {
		await addLibraryButtons(m);
	}
	return m;
}
