import * as Eris from "eris";
import Jimp from "jimp";
import { enums } from "ygopro-data";
import { Card } from "ygopro-data/dist/class/Card";
import { botOpts } from "./commands";
import { colors, config } from "./configs";
import { data, imageExt } from "./data";
import { strings } from "./strings";
import { getLang } from "./util";

function reEscape(s: string): string {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

interface ISearchQuery {
    image: boolean;
    mobile: boolean;
    res: string;
}

export async function cardSearch(msg: Eris.Message): Promise<void> {
    const results: ISearchQuery[] = [];

    const fullBrackets = config.getConfig("fullBrackets").getValue(msg);
    // strip cases of more than one bracket to minimise conflicts with other bots and spoiler feature
    const badFullRegex = new RegExp(reEscape(fullBrackets[0]) + "{2,}.+?" + reEscape(fullBrackets[1]) + "{2,}");
    let content = msg.content.replace(badFullRegex, "");
    const fullRegex = new RegExp(reEscape(fullBrackets[0]) + "(.+?)" + reEscape(fullBrackets[1]), "g");
    let fullResult = fullRegex.exec(content);
    while (fullResult !== null) {
        results.push({
            image: false,
            mobile: false,
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
        results.push({
            image: true,
            mobile: true,
            res: mobResult[1]
        });
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
        return;
    }

    for (const result of results) {
        const query = getLang(msg, result.res);
        const card = await data.getCard(query.msg, query.lang1);
        if (card) {
            const profile = await generateCardProfile(card, query.lang2, msg, result.mobile);
            if (result.mobile && result.image) {
                const image = await getCompositeImage(card);
                if (image) {
                    const file = {
                        file: image,
                        name: card.id.toString() + "." + imageExt
                    };
                    await msg.channel.createMessage("", file);
                }
            }
            await msg.channel.createMessage(profile);
        }
    }
}

function getColour(card: Card, msg: Eris.Message): number {
    for (const type in colors) {
        if (colors.hasOwnProperty(type)) {
            if (card.data.isType(parseInt(type, 16))) {
                return colors[type];
            }
        }
    }
    return config.getConfig("embedColor").getValue(msg);
}

async function generateCardProfile(
    card: Card,
    lang: string,
    msg: Eris.Message,
    mobile: boolean = false
): Promise<Eris.MessageContent> {
    try {
        let stats: string = "";
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
        const type = "**" + strings.getTranslation("type", lang, msg) + "**: " + card.data.names[lang].typeString;
        stats += type;
        if (card.data.names[lang].attribute.length > 0) {
            stats +=
                " **" +
                strings.getTranslation("attribute", lang, msg) +
                "**: " +
                card.data.names[lang].attribute.join("|");
        }
        stats += "\n";
        if (card.data.isType(enums.type.TYPE_MONSTER)) {
            let levelName = strings.getTranslation("level", lang, msg);
            if (card.data.isType(enums.type.TYPE_XYZ)) {
                levelName = strings.getTranslation("rank", lang, msg);
            } else if (card.data.isType(enums.type.TYPE_LINK)) {
                levelName = strings.getTranslation("linkRating", lang, msg);
            }
            stats +=
                "**" +
                levelName +
                "**: " +
                card.data.level +
                " **" +
                strings.getTranslation("atk", lang, msg) +
                "**: " +
                (card.data.atk === -2 ? "?" : card.data.atk);
            if (card.data.linkMarker) {
                stats +=
                    " **" + strings.getTranslation("linkArrows", lang, msg) + "**: " + card.data.linkMarker.join("");
            } else if (card.data.def) {
                stats +=
                    " **" +
                    strings.getTranslation("def", lang, msg) +
                    "**: " +
                    (card.data.def === -2 ? "?" : card.data.def);
            }
            if (card.data.lscale && card.data.rscale) {
                stats +=
                    " **" +
                    strings.getTranslation("scale", lang, msg) +
                    "**: " +
                    card.data.lscale +
                    "/" +
                    card.data.rscale;
            }
            stats += "\n";
        }
        let textHeader = strings.getTranslation("cardEffect", lang, msg);
        if (card.data.isType(enums.type.TYPE_NORMAL)) {
            textHeader = strings.getTranslation("flavourText", lang, msg);
        } else if (card.data.isType(enums.type.TYPE_EFFECT)) {
            textHeader = strings.getTranslation("monsterEffect", lang, msg);
        }
        const codes = await card.aliasIDs;
        const codeString = codes.join(" | ");
        if (mobile) {
            const outString =
                "__**" +
                card.text[lang].name +
                "**__\n**" +
                strings.getTranslation("id", lang, msg) +
                "**: " +
                codeString +
                "\n" +
                stats +
                "**" +
                textHeader +
                "**:\n" +
                card.text[lang].desc;
            return outString;
        }
        const outEmbed: Eris.MessageContent = {
            embed: {
                color: getColour(card, msg),
                description: stats,
                fields: [
                    {
                        name: textHeader,
                        value: card.text[lang].desc
                    }
                ],
                footer: { text: codeString },
                thumbnail: { url: card.imageLink },
                title: card.text[lang].name
            }
        };
        return outEmbed;
    } catch (e) {
        throw e;
    }
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
                const tempCanvas = await Jimp.read(tempImg);
                await tempCanvas.resize(100, Jimp.AUTO);
                const tempImage = await tempCanvas.getBufferAsync(tempCanvas.getMIME());
                images.push(tempImage);
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
