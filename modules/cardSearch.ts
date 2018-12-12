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
    if (card.data.names[lang].type.includes(translations.getTrans(lang).getType(enums.type.TYPE_MONSTER))) {
        stats += "**Level**: " + card.data.level + " **ATK**: " + card.data.atk + " **DEF**: " + card.data.def + "\n";
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
    const baseCard = await data.getCard(codes[0]);
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
            thumbnail: { url: baseCard!.imageLink },
            title: card.text[lang].name
        }
    };
    return outEmbed;
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
            const canvas = await Jimp.read(row[0]);
            for (let i = 1; i < ROW_LENGTH; i++) {
                await canvas.resize(canvas.getWidth() + 100, canvas.getHeight());
                if (i in row) {
                    const newImg = await Jimp.read(row[i]);
                    await canvas.composite(newImg, canvas.getWidth() - 100, 0);
                }
            }
            const buf = await canvas.getBufferAsync(canvas.getMIME());
            rowsAfter.push(buf);
        }
        const final = await Jimp.read(rowsAfter[0]);
        const rowHeight = final.getHeight();
        if (rowsAfter.length > 1) {
            for (let i = 1; i < rowsAfter.length; i++) {
                await final.resize(final.getWidth(), final.getHeight() + rowHeight);
                const row = await Jimp.read(rowsAfter[i]);
                await final.composite(row, 0, final.getHeight() - rowHeight);
            }
        }
        const image = await final.getBufferAsync(final.getMIME());
        return image;
    }
}
