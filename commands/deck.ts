import { Message, MessageContent } from "eris";
import fetch from "node-fetch";
import { enums } from "ygopro-data";
import { Command } from "../modules/Command";
import { config } from "../modules/configs";
import { data } from "../modules/data";
import { trimMsg, messageCapSlice, canReact } from "../modules/util";
import atob from "atob";

interface DeckSection {
	[name: string]: number;
}

interface DeckRecord {
	monster: DeckSection;
	spell: DeckSection;
	trap: DeckSection;
	extra: DeckSection;
	side: DeckSection;
	filename: string;
}

const valSum = (obj: DeckSection): number => {
	const counts = Object.values(obj);
	if (counts.length === 0) {
		return 0;
	}
	return counts.reduce((acc, val) => acc + val);
};

function byte(c: string): number {
	return c.charCodeAt(0);
}

function toPasscodes(base64: string): Uint32Array {
	return new Uint32Array(Uint8Array.from(atob(base64), byte).buffer);
}

async function getDeckFromFile(msg: Message, lang: string): Promise<DeckRecord> {
	const attach = msg.attachments[0];
	const file = await fetch(attach.url);
	const deck = await file.text();
	const deckRecord: DeckRecord = {
		extra: {},
		monster: {},
		side: {},
		spell: {},
		trap: {},
		filename: attach.filename
	};

	let currentSection = "";
	for (const line of deck.split(/\r|\n|\r\n/)) {
		if (line.startsWith("#") || line.startsWith("!")) {
			currentSection = line.slice(1);
			continue;
		}
		if (line.trim().length > 0) {
			const card = await data.getCard(line, lang);
			if (card) {
				let name = card.id.toString();
				if (card.text[lang]) {
					name = card.text[lang].name;
				}
				if (currentSection === "side") {
					if (name in deckRecord.side) {
						deckRecord.side[name]++;
					} else {
						deckRecord.side[name] = 1;
					}
				} else if (currentSection === "extra") {
					if (name in deckRecord.extra) {
						deckRecord.extra[name]++;
					} else {
						deckRecord.extra[name] = 1;
					}
				} else if (currentSection === "main") {
					if (card.data.isType(enums.type.TYPE_MONSTER)) {
						if (name in deckRecord.monster) {
							deckRecord.monster[name]++;
						} else {
							deckRecord.monster[name] = 1;
						}
					} else if (card.data.isType(enums.type.TYPE_SPELL)) {
						if (name in deckRecord.spell) {
							deckRecord.spell[name]++;
						} else {
							deckRecord.spell[name] = 1;
						}
					} else if (card.data.isType(enums.type.TYPE_TRAP)) {
						if (name in deckRecord.trap) {
							deckRecord.trap[name]++;
						} else {
							deckRecord.trap[name] = 1;
						}
					}
				}
			}
		}
	}

	return deckRecord;
}

async function getDeckFromURL(ydke: string, lang: string): Promise<DeckRecord> {
	const deckRecord: DeckRecord = {
		extra: {},
		monster: {},
		side: {},
		spell: {},
		trap: {},
		filename: "YDKE"
	};
	const components = ydke.slice("ydke://".length).split("!");
	const main = toPasscodes(components[0]);
	const extra = toPasscodes(components[1]);
	const side = toPasscodes(components[2]);
	for (const code of main) {
		const card = await data.getCard(code, lang);
		if (card) {
			let name = card.id.toString();
			if (card.text[lang]) {
				name = card.text[lang].name;
			}
			if (card.data.isType(enums.type.TYPE_MONSTER)) {
				if (name in deckRecord.monster) {
					deckRecord.monster[name]++;
				} else {
					deckRecord.monster[name] = 1;
				}
			} else if (card.data.isType(enums.type.TYPE_SPELL)) {
				if (name in deckRecord.spell) {
					deckRecord.spell[name]++;
				} else {
					deckRecord.spell[name] = 1;
				}
			} else if (card.data.isType(enums.type.TYPE_TRAP)) {
				if (name in deckRecord.trap) {
					deckRecord.trap[name]++;
				} else {
					deckRecord.trap[name] = 1;
				}
			}
		}
	}

	for (const code of extra) {
		const card = await data.getCard(code, lang);
		if (card) {
			let name = card.id.toString();
			if (card.text[lang]) {
				name = card.text[lang].name;
			}
			if (name in deckRecord.extra) {
				deckRecord.extra[name]++;
			} else {
				deckRecord.extra[name] = 1;
			}
		}
	}

	for (const code of side) {
		const card = await data.getCard(code, lang);
		if (card) {
			let name = card.id.toString();
			if (card.text[lang]) {
				name = card.text[lang].name;
			}
			if (name in deckRecord.side) {
				deckRecord.side[name]++;
			} else {
				deckRecord.side[name] = 1;
			}
		}
	}

	return deckRecord;
}

const names = ["deck", "parse"];
const func = async (msg: Message, mobile: boolean): Promise<Message | undefined> => {
	let lang: string = config.getConfig("defaultLang").getValue(msg);
	const content = trimMsg(msg);
	for (const term of content.split(/ +/)) {
		if (data.langs.includes(term.toLowerCase())) {
			lang = term.toLowerCase();
		}
	}

	let deckRecord: DeckRecord;
	if (msg.attachments.length > 0 && msg.attachments[0].filename.endsWith(".ydk")) {
		deckRecord = await getDeckFromFile(msg, lang);
	} else {
		const ydke = msg.content.split(/ +/)[1];
		if (ydke.startsWith("ydke://")) {
			deckRecord = await getDeckFromURL(ydke, lang);
		} else {
			await msg.channel.createMessage(
				"Sorry, you need to upload a deck file or provide a valid YDKE URL to use this command!"
			);
			return;
		}
	}

	const title = "Contents of " + deckRecord.filename + ":\n";
	const monsterCount = valSum(deckRecord.monster);
	const spellCount = valSum(deckRecord.spell);
	const trapCount = valSum(deckRecord.trap);
	const mainCount = monsterCount + spellCount + trapCount;
	let mainHeader = "Main Deck (" + mainCount + " cards - ";
	const headerParts: string[] = [];
	if (monsterCount > 0) {
		headerParts.push(monsterCount + " Monsters");
	}
	if (spellCount > 0) {
		headerParts.push(spellCount + " Spells");
	}
	if (trapCount > 0) {
		headerParts.push(trapCount + " Traps");
	}
	mainHeader += headerParts.join(", ") + ")";
	let mainBody = "";
	for (const name in deckRecord.monster) {
		mainBody += deckRecord.monster[name] + " " + name + "\n";
	}
	for (const name in deckRecord.spell) {
		mainBody += deckRecord.spell[name] + " " + name + "\n";
	}
	for (const name in deckRecord.trap) {
		mainBody += deckRecord.trap[name] + " " + name + "\n";
	}
	const extraCount = valSum(deckRecord.extra);
	const extraHeader = "Extra Deck (" + extraCount + " cards)";
	let extraBody = "";
	for (const name in deckRecord.extra) {
		extraBody += deckRecord.extra[name] + " " + name + "\n";
	}
	const sideCount = valSum(deckRecord.side);
	const sideHeader = "Side Deck (" + sideCount + " cards)";
	let sideBody = "";
	for (const name in deckRecord.side) {
		sideBody += deckRecord.side[name] + " " + name + "\n";
	}
	const chan = await msg.author.getDMChannel();
	let m: Message | undefined;
	if (mobile) {
		let out = title;
		if (mainCount > 0) {
			out += "__" + mainHeader + "__:\n" + mainBody;
		}
		if (extraCount > 0) {
			out += "__" + extraHeader + "__:\n" + extraBody;
		}
		if (sideCount > 0) {
			out += "__" + sideHeader + "__:\n" + sideBody;
		}
		const outStrings: string[] = messageCapSlice(out);
		for (const outString of outStrings) {
			m = await chan.createMessage(outString);
		}
	} else {
		const out: MessageContent = {
			embed: { title, fields: [], color: config.getConfig("embedColor").getValue(msg) }
		};
		// come on typescript, really? it's declared right there
		if (out.embed && out.embed.fields) {
			if (mainCount > 0) {
				const mainOuts = messageCapSlice(mainBody, 1024);
				for (let i = 0; i < mainOuts.length; i++) {
					out.embed.fields.push({ name: mainHeader + (i > 0 ? " (Continued)" : ""), value: mainOuts[i] });
				}
			}
			if (extraCount > 0) {
				const extraOuts = messageCapSlice(extraBody, 1024);
				for (let i = 0; i < extraOuts.length; i++) {
					out.embed.fields.push({ name: extraHeader + (i > 0 ? " (Continued)" : ""), value: extraOuts[i] });
				}
			}
			if (sideCount > 0) {
				const sideOuts = messageCapSlice(sideBody, 1024);
				for (let i = 0; i < sideOuts.length; i++) {
					out.embed.fields.push({ name: sideHeader + (i > 0 ? " (Continued)" : ""), value: sideOuts[i] });
				}
			}
		}

		m = await chan.createMessage(out);
	}
	if (canReact(msg)) {
		await msg.addReaction("📬");
	}
	return m;
};

const desc = "Parses and lists the contents of a YGOPro `.ydk` deck file or EDOPRO `ydke://` URL.";

export const command = new Command(names, func, undefined, desc, "[YDKE|<upload a `.ydk` file in the same message>]");
