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
                const card = await data_1.data.getCard(res, query.lang1);
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
    if (card.data.names[lang].type.includes(ygopro_data_1.translations.getTrans(lang).getType(ygopro_data_1.enums.type.TYPE_MONSTER))) {
        stats += "**Level**: " + card.data.level + " **ATK**: " + card.data.atk + " **DEF**: " + card.data.def + "\n";
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
    const baseCard = await data_1.data.getCard(codes[0]);
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
            thumbnail: { url: baseCard.imageLink },
            title: card.text[lang].name
        }
    };
    return outEmbed;
}
async function getCompositeImage(card) {
    const ROW_LENGTH = 4;
    const images = [];
    const codes = await card.aliasIDs;
    for (const code of codes) {
        const tempCard = await data_1.data.getCard(code, "en");
        if (tempCard) {
            const tempImg = await tempCard.image;
            if (tempImg) {
                const tempCanvas = await jimp_1.default.read(tempImg);
                await tempCanvas.resize(100, tempCanvas.getHeight());
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
            const canvas = await jimp_1.default.read(row[0]);
            for (let i = 1; i < ROW_LENGTH; i++) {
                await canvas.resize(canvas.getWidth() + 100, canvas.getHeight());
                if (i in row) {
                    const newImg = await jimp_1.default.read(row[i]);
                    await canvas.composite(newImg, canvas.getWidth() - 100, 0);
                }
            }
            const buf = await canvas.getBufferAsync(canvas.getMIME());
            rowsAfter.push(buf);
        }
        const final = await jimp_1.default.read(rowsAfter[0]);
        const rowHeight = final.getHeight();
        if (rowsAfter.length > 1) {
            for (let i = 1; i < rowsAfter.length; i++) {
                await final.resize(final.getWidth(), final.getHeight() + rowHeight);
                const row = await jimp_1.default.read(rowsAfter[i]);
                await final.composite(row, 0, final.getHeight() - rowHeight);
            }
        }
        const image = await final.getBufferAsync(final.getMIME());
        return image;
    }
}
//# sourceMappingURL=cardSearch.js.map