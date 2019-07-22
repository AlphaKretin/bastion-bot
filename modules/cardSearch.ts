import * as Eris from "eris";
import Jimp from "jimp";
import { Card, enums } from "ygopro-data";
import { ignore } from "../bastion";
import { addReactionButton, bot, logDeleteMessage } from "./bot";
import { botOpts } from "./commands";
import { colors, config, emotes } from "./configs";
import { data, imageExt } from "./data";
import { Errors } from "./errors";
import { strings } from "./strings";
import { canReact, getLang } from "./util";

function reEscape(s: string): string {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

interface ISearchQuery {
    image: boolean;
    mobile: boolean;
    res: string;
}

export async function cardSearch(msg: Eris.Message): Promise<void | Eris.Message> {
    let react: boolean = false;
    const results: ISearchQuery[] = [];
    const codeBlocks = /```[\s\S]+?```|`[\s\S]+?`/g;
    let content = msg.content.replace(codeBlocks, "");
    const fullBrackets = config.getConfig("fullBrackets").getValue(msg);
    // strip cases of more than one bracket to minimise conflicts with other bots and spoiler feature
    const badFullRegex = new RegExp(reEscape(fullBrackets[0]) + "{2,}.+?" + reEscape(fullBrackets[1]) + "{2,}");
    content = content.replace(badFullRegex, "");
    const fullRegex = new RegExp(reEscape(fullBrackets[0]) + "(.+?)" + reEscape(fullBrackets[1]), "g");
    let fullResult = fullRegex.exec(content);
    while (fullResult !== null) {
        if (!react) {
            await msg.addReaction("🕙").catch(ignore);
            react = true;
        }
        results.push({
            image: false,
            mobile: config.getConfig("mobileView").getValue(msg),
            res: fullResult[1]
        });
        fullResult = fullRegex.exec(content);
    }

    const mobBrackets = config.getConfig("mobBrackets").getValue(msg);
    const badMobRegex = new RegExp(reEscape(mobBrackets[0]) + "{2,}.+?" + reEscape(mobBrackets[1]) + "{2,}");
    content = content.replace(badMobRegex, "");
    const mobRegex = new RegExp(reEscape(mobBrackets[0]) + "(.+?)" + reEscape(mobBrackets[1]), "g");
    let mobResult = mobRegex.exec(content);
    while (mobResult !== null) {
        const match = mobResult[1];
        // TODO: Apply to all in case of customised brackets
        if (!(match.startsWith("!") || match.startsWith(":") || match.startsWith("@") || match.startsWith("#"))) {
            if (!react) {
                await msg.addReaction("🕙").catch(ignore);
                react = true;
            }

            results.push({
                image: true,
                mobile: true,
                res: match
            });
        }
        mobResult = mobRegex.exec(content);
    }

    const noImgMobBrackets = config.getConfig("noImgMobBrackets").getValue(msg);
    const badNoImgMobRegex = new RegExp(
        reEscape(noImgMobBrackets[0]) + "{2,}.+?" + reEscape(noImgMobBrackets[1]) + "{2,}"
    );
    content = content.replace(badNoImgMobRegex, "");
    const noImgMobRegex = new RegExp(reEscape(noImgMobBrackets[0]) + "(.+?)" + reEscape(noImgMobBrackets[1]), "g");
    let noImgMobResult = noImgMobRegex.exec(content);
    while (noImgMobResult !== null) {
        if (!react) {
            await msg.addReaction("🕙").catch(ignore);
            react = true;
        }
        results.push({
            image: false,
            mobile: true,
            res: noImgMobResult[1]
        });
        noImgMobResult = noImgMobRegex.exec(content);
    }

    if (results.length > botOpts.maxSearch) {
        const lang = getLang(msg, results[0].res);
        await msg.channel.createMessage(strings.getTranslation("searchCap", lang.lang1, msg, botOpts.maxSearch));
        if (react) {
            await msg.removeReaction("🕙").catch(ignore);
        }
        return;
    }

    for (const result of results) {
        const query = getLang(msg, result.res);
        const card = await data.getCard(query.msg, query.lang1);
        if (card) {
            const m = await sendCardProfile(msg, card, query.lang2, result.mobile, result.image);
            if (m) {
                logDeleteMessage(msg, m);
            }
        }
    }
    if (react) {
        await msg.removeReaction("🕙").catch(ignore);
    }
}

export async function sendCardProfile(
    msg: Eris.Message,
    card: Card,
    lang: string,
    mobile: boolean = false,
    includeImage: boolean = false
) {
    if (card) {
        const profile = await generateCardProfile(card, lang, msg, mobile);
        if (mobile && includeImage) {
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
                        chan.createMessage(profile[i]);
                    }
                });
            }
        } else {
            await msg.channel.createMessage(Errors.ERROR_REACT_FAILURE);
        }
        return m;
    }
}

export function getColour(card: Card, msg: Eris.Message): number {
    for (const type in colors) {
        if (colors.hasOwnProperty(type)) {
            if (card.data.isType(parseInt(type, 16))) {
                return colors[type];
            }
        }
    }
    return config.getConfig("embedColor").getValue(msg);
}

export async function generateCardProfile(
    card: Card,
    lang: string,
    msg: Eris.Message,
    mobile: boolean = false
): Promise<Eris.MessageContent[]> {
    try {
        const stats = await generateCardStats(card, lang, msg);
        let textHeader = strings.getTranslation("cardEffect", lang, msg);
        if (card.data.isType(enums.type.TYPE_NORMAL)) {
            textHeader = strings.getTranslation("flavourText", lang, msg);
        } else if (card.data.isType(enums.type.TYPE_EFFECT)) {
            textHeader = strings.getTranslation("monsterEffect", lang, msg);
        }
        const codes = await card.aliasIDs;
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
            if (desc.pendHead) {
                outString +=
                    "**" +
                    desc.pendHead +
                    "**:\n" +
                    desc.pendBody +
                    "\n**" +
                    desc.monsterHead +
                    "**:\n" +
                    desc.monsterBody;
            } else {
                outString += "**" + textHeader + "**:\n" + desc.monsterBody;
            }
            const outStrings: string[] = [];
            const MESSAGE_CAP = 2000;
            while (outString.length > MESSAGE_CAP) {
                let index = outString.slice(0, MESSAGE_CAP).lastIndexOf("\n");
                if (index === -1 || index >= MESSAGE_CAP) {
                    index = outString.slice(0, MESSAGE_CAP).lastIndexOf(".");
                    if (index === -1 || index >= MESSAGE_CAP) {
                        index = outString.slice(0, MESSAGE_CAP).lastIndexOf(" ");
                        if (index === -1 || index >= MESSAGE_CAP) {
                            index = MESSAGE_CAP - 1;
                        }
                    }
                }
                outStrings.push(outString.slice(0, index + 1));
                outString = outString.slice(index + 1);
            }
            outStrings.push(outString);
            return outStrings;
        }
        const outEmbed: Eris.MessageContent = {
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
        if (desc.pendHead) {
            outEmbed.embed!.fields!.push({
                name: desc.pendHead,
                value: desc.pendBody
            });
            textHeader = desc.monsterHead!;
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
        descPortions.push(descPortion);
        outEmbed.embed!.fields!.push({
            name: textHeader,
            value: descPortions[0].length > 0 ? descPortions[0] : strings.getTranslation("noText", lang, msg)
        });
        for (let i = 1; i < descPortions.length; i++) {
            outEmbed.embed!.fields!.push({
                name: "Continued",
                value: descPortions[i].length > 0 ? descPortions[i] : strings.getTranslation("noText", lang, msg)
            });
        }
        return [outEmbed];
    } catch (e) {
        throw e;
    }
}

export async function generateCardStats(card: Card, lang: string, msg: Eris.Message) {
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
    let type = "**" + strings.getTranslation("type", lang, msg) + "**: " + card.data.names[lang].typeString;
    if (displayEmotes) {
        if (!card.data.isType(enums.type.TYPE_MONSTER) && "type" in emotes) {
            for (const t in emotes.type) {
                if (emotes.type.hasOwnProperty(t)) {
                    if (card.data.isType(parseInt(t, 16))) {
                        type += " " + emotes.type[t];
                    }
                }
            }
        } else if ("race" in emotes) {
            for (const r in emotes.race) {
                if (emotes.race.hasOwnProperty(r)) {
                    if (card.data.isRace(parseInt(r, 16))) {
                        type += " " + emotes.race[r];
                    }
                }
            }
        }
    }
    stats += type;
    if (card.data.names[lang].attribute.length > 0) {
        stats +=
            " **" + strings.getTranslation("attribute", lang, msg) + "**: " + card.data.names[lang].attribute.join("|");
    }
    if (displayEmotes && "attribute" in emotes) {
        for (const a in emotes.attribute) {
            if (emotes.attribute.hasOwnProperty(a)) {
                if (card.data.isAttribute(parseInt(a, 16))) {
                    stats += " " + emotes.attribute[a];
                }
            }
        }
    }
    stats += "\n";
    if (card.data.isType(enums.type.TYPE_MONSTER)) {
        let levelName = strings.getTranslation("level", lang, msg);
        let levelEmote: string | undefined = "misc" in emotes ? emotes.misc.level : undefined;
        if (card.data.isType(enums.type.TYPE_XYZ)) {
            levelName = strings.getTranslation("rank", lang, msg);
            levelEmote = "misc" in emotes ? emotes.misc.rank : undefined;
        } else if (card.data.isType(enums.type.TYPE_LINK)) {
            levelName = strings.getTranslation("linkRating", lang, msg);
            levelEmote = undefined;
        }
        stats += "**" + levelName + "**: " + card.data.level;
        if (displayEmotes && levelEmote) {
            stats += " " + levelEmote;
        }
        stats +=
            " **" + strings.getTranslation("atk", lang, msg) + "**: " + (card.data.atk === -2 ? "?" : card.data.atk);
        if (card.data.linkMarker) {
            stats += " **" + strings.getTranslation("linkArrows", lang, msg) + "**: " + card.data.linkMarker.join("");
        } else if (card.data.def !== undefined) {
            stats +=
                " **" +
                strings.getTranslation("def", lang, msg) +
                "**: " +
                (card.data.def === -2 ? "?" : card.data.def);
        }
        if (card.data.lscale && card.data.rscale) {
            if (displayEmotes && "misc" in emotes && "leftScale" in emotes.misc) {
                stats += emotes.misc.leftScale;
            }
            stats +=
                " **" + strings.getTranslation("scale", lang, msg) + "**: " + card.data.lscale + "/" + card.data.rscale;
            if (displayEmotes && "misc" in emotes && "rightScale" in emotes.misc) {
                stats += emotes.misc.rightScale;
            }
        }
        stats += "\n";
    }
    return stats;
}

async function compose(a: Jimp, b: Jimp, vert: boolean = false): Promise<Jimp> {
    const wid = vert ? Math.max(a.getWidth(), b.getWidth()) : a.getWidth() + b.getWidth();
    const hi = vert ? a.getHeight() + b.getHeight() : Math.max(a.getHeight(), b.getHeight());
    const canvas = new Jimp(wid, hi);
    await canvas.composite(a, 0, 0);
    await canvas.composite(b, vert ? 0 : a.getWidth(), vert ? a.getHeight() : 0);
    return canvas;
}

async function getCompositeImage(card: Card): Promise<Buffer | undefined> {
    const ROW_LENGTH = 4;
    const images: Buffer[] = [];
    const codes = await card.aliasIDs;
    for (const code of codes) {
        const tempCard = await data.getCard(code);
        if (tempCard) {
            const tempImg = await tempCard.image;
            if (tempImg) {
                try {
                    const tempCanvas = await Jimp.read(tempImg);
                    await tempCanvas.resize(100, Jimp.AUTO);
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
                    canvas = await compose(
                        canvas,
                        newImg
                    );
                }
            }
            const buf = await canvas.getBufferAsync(canvas.getMIME());
            rowsAfter.push(buf);
        }
        let final = await Jimp.read(rowsAfter[0]);
        if (rowsAfter.length > 1) {
            for (let i = 1; i < rowsAfter.length; i++) {
                const row = await Jimp.read(rowsAfter[i]);
                final = await compose(
                    final,
                    row,
                    true
                );
            }
        }
        const image = await final.getBufferAsync(final.getMIME());
        return image;
    }
}
