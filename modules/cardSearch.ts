import * as Eris from "eris";
import Jimp from "jimp";
import { enums } from "ygopro-data";
import { Card } from "ygopro-data/dist/class/Card";
import { colors, config } from "./configs";
import { data, imageExt } from "./data";
import { strings } from "./strings";
import { getLang } from "./util";

export async function cardSearch(msg: Eris.Message): Promise<void> {
    const baseRegex = /{(.+)}/g;
    const baseResult = baseRegex.exec(msg.content);
    if (baseResult) {
        baseResult.forEach(async (res, i) => {
            // ignore full match
            if (i > 0) {
                const query = getLang(msg, res);
                const card = await data.getCard(query.msg, query.lang1);
                if (card) {
                    const profile = await generateCardProfile(card, query.lang2, msg);
                    msg.channel.createMessage(profile);
                }
            }
        });
    }

    const imageRegex = /<(.+)>/g;
    const imageResult = imageRegex.exec(msg.content);
    if (imageResult) {
        imageResult.forEach(async (res, i) => {
            // ignore full match
            if (i > 0) {
                const query = getLang(msg, res);
                const card = await data.getCard(query.msg, query.lang1);
                if (card) {
                    const image = await getCompositeImage(card);
                    let file: Eris.MessageFile | undefined;
                    if (image) {
                        file = {
                            file: image,
                            name: card.id.toString() + "." + imageExt
                        };
                    }
                    await msg.channel.createMessage("", file);
                    const profile = await generateCardProfile(card, query.lang2, msg, true);
                    msg.channel.createMessage(profile);
                }
            }
        });
    }

    const mobileRegex = /\[(.+)\]/g;
    const mobileResult = mobileRegex.exec(msg.content);
    if (mobileResult) {
        mobileResult.forEach(async (res, i) => {
            // ignore full match
            if (i > 0) {
                const query = getLang(msg, res);
                const card = await data.getCard(query.msg, query.lang1);
                if (card) {
                    const profile = await generateCardProfile(card, query.lang2, msg, true);
                    msg.channel.createMessage(profile);
                }
            }
        });
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
            stats += "\n";
        }
        let textHeader = strings.getTranslation("cardEffect", lang, msg);
        if (card.data.isType(enums.type.TYPE_NORMAL)) {
            textHeader = strings.getTranslation("flavourText", lang, msg);
        } else if (card.data.isType(enums.type.TYPE_EFFECT)) {
            textHeader = strings.getTranslation("monsterEffect", lang, msg);
        }
        const codes = await card.aliasIDs;
        const codeString = codes.join("|");
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
