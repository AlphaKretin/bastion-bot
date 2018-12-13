import * as Eris from "eris";
import Jimp from "jimp";
import { enums, translations } from "ygopro-data";
import { Card } from "ygopro-data/dist/class/Card";
import { data, imageExt } from "./data";
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
                    const profile = await generateCardProfile(card, query.lang2);
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
                    const profile = await generateCardProfile(card, query.lang2, true);
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
                    const profile = await generateCardProfile(card, query.lang2, true);
                    msg.channel.createMessage(profile);
                }
            }
        });
    }
}

async function generateCardProfile(card: Card, lang: string, mobile: boolean = false): Promise<Eris.MessageContent> {
    let stats: string = "";
    const setNames = await card.data.names[lang].setcode;
    if (setNames.length > 0) {
        stats += "**Archetype**: " + setNames.join(", ");
    }
    stats += "\n";
    const type = "**Type**: " + card.data.names[lang].typeString;
    stats += type;
    if (card.data.names[lang].attribute.length > 0) {
        stats += " **Attribute**: " + card.data.names[lang].attribute.join("|");
    }
    stats += "\n";
    if (card.data.isType(enums.type.TYPE_MONSTER)) {
        stats +=
            "**Level**: " +
            card.data.level +
            " **ATK**: " +
            (card.data.atk === -2 ? "?" : card.data.atk) +
            " **DEF**: " +
            (card.data.def === -2 ? "?" : card.data.def) +
            "\n";
    }
    const codes = await card.aliasIDs;
    const codeString = codes.join("|");
    if (mobile) {
        const outString =
            "__**" +
            card.text[lang].name +
            "**__\n**ID**: " +
            codeString +
            "\n" +
            stats +
            "**Card Text**:\n" +
            card.text[lang].desc;
        return outString;
    }
    const outEmbed: Eris.MessageContent = {
        embed: {
            description: stats,
            fields: [
                {
                    name: "Card Text",
                    value: card.text[lang].desc
                }
            ],
            footer: { text: codeString },
            thumbnail: { url: card.imageLink },
            title: card.text[lang].name
        }
    };
    return outEmbed;
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
