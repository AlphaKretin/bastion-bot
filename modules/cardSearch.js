"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jimp_1 = __importDefault(require("jimp"));
const ygopro_data_1 = require("ygopro-data");
const data_1 = require("./data");
const util_1 = require("./util");
async function cardSearch(msg) {
    const baseRegex = /{(.+)}/g;
    const baseResult = baseRegex.exec(msg.content);
    if (baseResult) {
        baseResult.forEach(async (res, i) => {
            // ignore full match
            if (i > 0) {
                const query = util_1.getLang(msg, res);
                const card = await data_1.data.getCard(query.msg, query.lang1);
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
                const query = util_1.getLang(msg, res);
                const card = await data_1.data.getCard(query.msg, query.lang1);
                if (card) {
                    const image = await getCompositeImage(card);
                    let file;
                    if (image) {
                        file = {
                            file: image,
                            name: card.id.toString() + "." + data_1.imageExt
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
                const query = util_1.getLang(msg, res);
                const card = await data_1.data.getCard(query.msg, query.lang1);
                if (card) {
                    const profile = await generateCardProfile(card, query.lang2, true);
                    msg.channel.createMessage(profile);
                }
            }
        });
    }
}
exports.cardSearch = cardSearch;
async function generateCardProfile(card, lang, mobile = false) {
    let stats = "";
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
    if (card.data.isType(ygopro_data_1.enums.type.TYPE_MONSTER)) {
        stats += "**Level**: " + card.data.level + " **ATK**: " + (card.data.atk === -2 ? "?" : card.data.atk);
        if (card.data.linkMarker) {
            stats += " **Link Arrows**: " + card.data.linkMarker.join("");
        }
        else if (card.data.def) {
            stats += " **DEF**: " + (card.data.def === -2 ? "?" : card.data.def);
        }
        stats += "\n";
    }
    const codes = await card.aliasIDs;
    const codeString = codes.join("|");
    if (mobile) {
        const outString = "__**" +
            card.text[lang].name +
            "**__\n**ID**: " +
            codeString +
            "\n" +
            stats +
            "**Card Text**:\n" +
            card.text[lang].desc;
        return outString;
    }
    const outEmbed = {
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
async function compose(a, b, vert = false) {
    const wid = vert ? Math.max(a.getWidth(), b.getWidth()) : a.getWidth() + b.getWidth();
    const hi = vert ? a.getHeight() + b.getHeight() : Math.max(a.getHeight(), b.getHeight());
    const canvas = new jimp_1.default(wid, hi);
    await canvas.composite(a, 0, 0);
    await canvas.composite(b, vert ? 0 : a.getWidth(), vert ? a.getHeight() : 0);
    return canvas;
}
async function getCompositeImage(card) {
    const ROW_LENGTH = 4;
    const images = [];
    const codes = await card.aliasIDs;
    for (const code of codes) {
        const tempCard = await data_1.data.getCard(code);
        if (tempCard) {
            const tempImg = await tempCard.image;
            if (tempImg) {
                const tempCanvas = await jimp_1.default.read(tempImg);
                await tempCanvas.resize(100, jimp_1.default.AUTO);
                const tempImage = await tempCanvas.getBufferAsync(tempCanvas.getMIME());
                images.push(tempImage);
            }
        }
    }
    if (images.length === 1) {
        return images[0];
    }
    if (images.length > 1) {
        const rowsBefore = [];
        while (images.length > 0) {
            const row = images.splice(0, ROW_LENGTH);
            rowsBefore.push(row);
        }
        const rowsAfter = [];
        for (const row of rowsBefore) {
            let canvas = await jimp_1.default.read(row[0]);
            for (let i = 1; i < ROW_LENGTH; i++) {
                if (i in row) {
                    const newImg = await jimp_1.default.read(row[i]);
                    canvas = await compose(canvas, newImg);
                }
            }
            const buf = await canvas.getBufferAsync(canvas.getMIME());
            rowsAfter.push(buf);
        }
        let final = await jimp_1.default.read(rowsAfter[0]);
        if (rowsAfter.length > 1) {
            for (let i = 1; i < rowsAfter.length; i++) {
                const row = await jimp_1.default.read(rowsAfter[i]);
                final = await compose(final, row, true);
            }
        }
        const image = await final.getBufferAsync(final.getMIME());
        return image;
    }
}
//# sourceMappingURL=cardSearch.js.map