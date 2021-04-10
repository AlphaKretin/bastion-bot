import { Message, MessageContent, PrivateChannel } from "eris";
import Jimp from "jimp";
import { Card, enums } from "ygopro-data";
import { ignore } from "../bastion";
import { addReactionButton, bot, logDeleteMessage } from "./bot";
import { config } from "./configs";
import { data } from "./data";
import { strings } from "./strings";
import { canReact, getLang, messageCapSlice } from "./util";
import { stats } from "./stats";
import { maxSearch } from "../config/botOpts.json";
import { type, race, attribute, misc } from "../config/emotes.json";
import { imageExt } from "../config/dataOpts.json";
import * as colors from "../config/colors.json";

function reEscape(s: string): string {
	return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

interface SearchQuery {
	mobile: boolean;
	res: string;
}

export async function generateCardStats(card: Card, lang: string, msg: Message): Promise<string> {
	const displayEmotes = !config.getConfig("suppressEmotes").getValue(msg);
	let stats = "";
	const setNames = await card.data.names[lang].setcode;
	if (setNames.length > 0) {
		stats += "**" + strings.getTranslation("setcode", lang, msg) + "**: " + setNames.join(", ");
	}
	stats += "\n";
	stats += "**" + strings.getTranslation("status", lang, msg) + "**: " + (await card.status);
	const price = await card.price;
	if (price) {
		stats +=
			"** " +
			strings.getTranslation("price", lang, msg) +
			"**: $" +
			price.low.toFixed(2) +
			"-$" +
			price.avg.toFixed(2) +
			"-$" +
			price.hi.toFixed(2) +
			" USD";
	}
	stats += "\n";
	let typeString = "**" + strings.getTranslation("type", lang, msg) + "**: " + card.data.names[lang].typeString;
	if (displayEmotes) {
		if (!card.data.isType(enums.type.TYPE_MONSTER) && type) {
			for (const t in type) {
				if (card.data.isType(parseInt(t, 16))) {
					typeString += " " + (type as { [key: string]: string })[t];
				}
			}
		} else if (race) {
			for (const r in race) {
				if (card.data.isRace(parseInt(r, 16))) {
					typeString += " " + (race as { [key: string]: string })[r];
				}
			}
		}
	}
	stats += typeString;
	if (card.data.names[lang].attribute.length > 0) {
		stats +=
			" **" + strings.getTranslation("attribute", lang, msg) + "**: " + card.data.names[lang].attribute.join("|");
	}
	if (displayEmotes && attribute) {
		for (const a in attribute) {
			if (card.data.isAttribute(parseInt(a, 16))) {
				stats += " " + (attribute as { [key: string]: string })[a];
			}
		}
	}
	stats += "\n";
	if (card.data.isType(enums.type.TYPE_MONSTER)) {
		let levelName = strings.getTranslation("level", lang, msg);
		let levelEmote: string | undefined = misc ? misc.level : undefined;
		if (card.data.isType(enums.type.TYPE_XYZ)) {
			levelName = strings.getTranslation("rank", lang, msg);
			levelEmote = misc ? misc.rank : undefined;
		} else if (card.data.isType(enums.type.TYPE_LINK)) {
			levelName = strings.getTranslation("linkRating", lang, msg);
			levelEmote = undefined;
		}
		stats += `**${levelName}**: ${card.data.level}`;
		if (displayEmotes && levelEmote) {
			stats += " " + levelEmote;
		}
		stats += ` **${strings.getTranslation("atk", lang, msg)}**: ${card.data.atk === -2 ? "?" : card.data.atk}`;
		if (card.data.linkMarker) {
			stats += " **" + strings.getTranslation("linkArrows", lang, msg) + "**: " + card.data.linkMarker.join("");
		} else if (card.data.def !== undefined) {
			stats += ` **${strings.getTranslation("def", lang, msg)}**: ${card.data.def === -2 ? "?" : card.data.def}`;
		}
		if (card.data.lscale && card.data.rscale) {
			stats += " **" + strings.getTranslation("scale", lang, msg) + "**: ";
			if (displayEmotes && misc && misc.scaleLeft) {
				stats += misc.scaleLeft;
			}
			stats += `${card.data.lscale}/${card.data.rscale}`;
			if (displayEmotes && misc && misc.scaleRight) {
				stats += misc.scaleRight;
			}
		}
		stats += "\n";
	}
	return stats;
}

export function getColour(card: Card, msg: Message): number {
	for (const type in colors) {
		if (card.data.isType(parseInt(type, 16))) {
			return (colors as { [key: string]: number })[type];
		}
	}
	return config.getConfig("embedColor").getValue(msg) as number;
}

export async function generateCardProfile(
	card: Card,
	lang: string,
	msg: Message,
	mobile = false
): Promise<MessageContent[]> {
	const stats = await generateCardStats(card, lang, msg);
	let textHeader = strings.getTranslation("cardEffect", lang, msg);
	if (card.data.isType(enums.type.TYPE_NORMAL)) {
		textHeader = strings.getTranslation("flavourText", lang, msg);
	} else if (card.data.isType(enums.type.TYPE_EFFECT)) {
		textHeader = strings.getTranslation("monsterEffect", lang, msg);
	}
	const codes = card.data.aliasedCards;
	const codeString = codes.join(" | ");
	const desc = card.text[lang].desc;
	if (mobile) {
		let outString =
			"__**" +
			card.text[lang].name +
			"**__\n**" +
			strings.getTranslation("id", lang, msg) +
			"**: " +
			codeString +
			"\n" +
			stats;
		if (desc.pendHead && desc.pendBody && desc.monsterHead) {
			outString +=
				"**" + desc.pendHead + "**:\n" + desc.pendBody + "\n**" + desc.monsterHead + "**:\n" + desc.monsterBody;
		} else {
			outString += "**" + textHeader + "**:\n" + desc.monsterBody;
		}
		return messageCapSlice(outString);
	}
	const outEmbed: MessageContent = {
		embed: {
			color: getColour(card, msg),
			description: stats,
			fields: [],
			footer: { text: codeString },
			thumbnail: { url: card.imageLink },
			title: card.text[lang].name
		}
	};
	const FIELD_CAP = 1024;
	const descPortions = [];
	if (desc.pendHead && desc.pendBody && outEmbed.embed && outEmbed.embed.fields && desc.monsterHead) {
		outEmbed.embed.fields.push({
			name: desc.pendHead,
			value: desc.pendBody
		});
		textHeader = desc.monsterHead;
	}
	let descPortion = desc.monsterBody;
	while (descPortion.length > FIELD_CAP) {
		let index = descPortion.slice(0, FIELD_CAP).lastIndexOf("\n");
		if (index === -1 || index >= FIELD_CAP) {
			index = descPortion.slice(0, FIELD_CAP).lastIndexOf(".");
			if (index === -1 || index >= FIELD_CAP) {
				index = descPortion.slice(0, FIELD_CAP).lastIndexOf(" ");
				if (index === -1 || index >= FIELD_CAP) {
					index = FIELD_CAP - 1;
				}
			}
		}
		descPortions.push(descPortion.slice(0, index + 1));
		descPortion = descPortion.slice(index + 1);
	}
	// guard against portions consisting only of trailing spaces
	if (descPortion.trim().length > 0) {
		descPortions.push(descPortion);
	}
	if (outEmbed.embed && outEmbed.embed.fields) {
		outEmbed.embed.fields.push({
			name: textHeader,
			value: descPortions[0].length > 0 ? descPortions[0] : strings.getTranslation("noText", lang, msg)
		});
		for (let i = 1; i < descPortions.length; i++) {
			outEmbed.embed.fields.push({
				name: "Continued",
				value: descPortions[i].length > 0 ? descPortions[i] : strings.getTranslation("noText", lang, msg)
			});
		}
	}
	return [outEmbed];
}

function compose(a: Jimp, b: Jimp, vert = false): Jimp {
	const wid = vert ? Math.max(a.getWidth(), b.getWidth()) : a.getWidth() + b.getWidth();
	const hi = vert ? a.getHeight() + b.getHeight() : Math.max(a.getHeight(), b.getHeight());
	const canvas = new Jimp(wid, hi);
	canvas.composite(a, 0, 0);
	canvas.composite(b, vert ? 0 : a.getWidth(), vert ? a.getHeight() : 0);
	return canvas;
}

async function getCompositeImage(card: Card): Promise<Buffer | undefined> {
	const ROW_LENGTH = 4;
	const images: Buffer[] = [];
	const codes = card.data.aliasedCards;
	for (const code of codes) {
		const tempCard = await data.getCard(code);
		if (tempCard) {
			const tempImg = await tempCard.image;
			if (tempImg) {
				try {
					const tempCanvas = await Jimp.read(tempImg);
					tempCanvas.resize(100, Jimp.AUTO);
					const tempImage = await tempCanvas.getBufferAsync(tempCanvas.getMIME());
					images.push(tempImage);
				} catch (e) {
					// does not throw - should proceed with no image but alert host
					console.error("Image not found or invalid for %s (%s)", card.text.en.name, card.id);
				}
			}
		}
	}
	if (images.length === 1) {
		return images[0];
	}
	if (images.length > 1) {
		const rowsBefore: Buffer[][] = [];
		while (images.length > 0) {
			const row = images.splice(0, ROW_LENGTH);
			rowsBefore.push(row);
		}
		const rowsAfter: Buffer[] = [];
		for (const row of rowsBefore) {
			let canvas = await Jimp.read(row[0]);
			for (let i = 1; i < ROW_LENGTH; i++) {
				if (i in row) {
					const newImg = await Jimp.read(row[i]);
					canvas = compose(canvas, newImg);
				}
			}
			const buf = await canvas.getBufferAsync(canvas.getMIME());
			rowsAfter.push(buf);
		}
		let final = await Jimp.read(rowsAfter[0]);
		if (rowsAfter.length > 1) {
			for (let i = 1; i < rowsAfter.length; i++) {
				const row = await Jimp.read(rowsAfter[i]);
				final = compose(final, row, true);
			}
		}
		const image = await final.getBufferAsync(final.getMIME());
		return image;
	}
}

export async function sendCardProfile(
	msg: Message,
	card: Card,
	lang: string,
	mobile = false
): Promise<Message | undefined> {
	if (card) {
		const profile = await generateCardProfile(card, lang, msg, mobile);
		if (mobile && card.data.aliasedCards.length > 1) {
			const image = await getCompositeImage(card);
			if (image) {
				const file = {
					file: image,
					name: card.id.toString() + "." + imageExt
				};
				const imageM = await msg.channel.createMessage("", file);
				logDeleteMessage(msg, imageM);
			}
		}
		const m = await msg.channel.createMessage(profile[0]);
		if (canReact(m)) {
			for (let i = 1; i < profile.length; i++) {
				await addReactionButton(m, "1\u20e3", async (_, userID) => {
					const user = bot.users.get(userID);
					if (user) {
						const chan = await user.getDMChannel();
						await chan.createMessage(profile[i]);
					}
				});
			}
		}
		return m;
	}
}

function badQuery(match: string): boolean {
	return (
		match.startsWith("!") ||
		match.startsWith(":") ||
		match.startsWith("a:") ||
		match.startsWith("@") ||
		match.startsWith("#") ||
		match.includes("://")
	);
}

export async function cardSearch(msg: Message): Promise<void | Message> {
	let react = false;
	const results: SearchQuery[] = [];
	const codeBlocks = /```[\s\S]+?```|`[\s\S]+?`/g;
	let content = msg.content.replace(codeBlocks, "");
	const fullBrackets = config.getConfig("fullBrackets").getValue(msg) as string[];
	// strip cases of more than one bracket to minimise conflicts with other bots and spoiler feature
	const badFullRegex = new RegExp(reEscape(fullBrackets[0]) + "{2,}.+?" + reEscape(fullBrackets[1]) + "{2,}", "g");
	content = content.replace(badFullRegex, "");
	const fullRegex = new RegExp(reEscape(fullBrackets[0]) + "(.+?)" + reEscape(fullBrackets[1]), "g");
	let fullResult = fullRegex.exec(content);
	while (fullResult !== null) {
		const match = fullResult[1];
		if (!badQuery(match)) {
			if (!react) {
				await msg.addReaction("🕙").catch(ignore);
				react = true;
			}

			results.push({
				mobile: config.getConfig("mobileView").getValue(msg) as boolean,
				res: match
			});
		}
		fullResult = fullRegex.exec(content);
	}

	const mobBrackets = config.getConfig("mobBrackets").getValue(msg) as string[];
	const badMobRegex = new RegExp(reEscape(mobBrackets[0]) + "{2,}.+?" + reEscape(mobBrackets[1]) + "{2,}", "g");
	content = content.replace(badMobRegex, "");
	const mobRegex = new RegExp(reEscape(mobBrackets[0]) + "(.+?)" + reEscape(mobBrackets[1]), "g");
	let mobResult = mobRegex.exec(content);
	while (mobResult !== null) {
		const match = mobResult[1];
		if (!badQuery(match)) {
			if (!react) {
				await msg.addReaction("🕙").catch(ignore);
				react = true;
			}

			results.push({
				mobile: true,
				res: match
			});
		}
		mobResult = mobRegex.exec(content);
	}

	if (results.length > maxSearch) {
		const lang = getLang(msg, results[0].res);
		await msg.channel.createMessage(strings.getTranslation("searchCap", lang.lang1, msg, maxSearch.toString()));
		if (react) {
			await msg.removeReaction("🕙").catch(ignore);
		}
		return;
	}
	const isDM = msg.channel instanceof PrivateChannel; // allow anime in DMs because no way to turn it on
	const allowAnime = isDM || (config.getConfig("allowAnime").getValue(msg) as boolean);
	const allowCustom = isDM || (config.getConfig("allowAnime").getValue(msg) as boolean);
	const usedResults: string[] = [];
	for (const result of results) {
		const query = getLang(msg, result.res);
		if (!usedResults.includes(query.msg)) {
			usedResults.push(query.msg);
			const scriptNameReg = /c(\d+)(\.lua)?/;
			let searchQuery = query.msg;
			const regResult = scriptNameReg.exec(query.msg);
			if (regResult !== null && 1 in regResult) {
				searchQuery = regResult[1];
			}
			const card = await data.getCard(searchQuery, query.lang1, allowAnime, allowCustom);
			if (card && query.lang2 in card.text) {
				const m = await sendCardProfile(msg, card, query.lang2, result.mobile);
				if (m) {
					logDeleteMessage(msg, m);
				}
				await stats.writeSearch(msg, query, card.id, result.mobile);
			} else if (card && query.lang1 in card.text) {
				const m = await sendCardProfile(msg, card, query.lang1, result.mobile);
				if (m) {
					logDeleteMessage(msg, m);
				}
				await stats.writeSearch(msg, query, card.id, result.mobile);
			}
		}
	}
	if (react) {
		await msg.removeReaction("🕙").catch(ignore);
	}
}
