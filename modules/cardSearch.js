"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jimp_1 = __importDefault(require("jimp"));
const ygopro_data_1 = require("ygopro-data");
const configs_1 = require("./configs");
const data_1 = require("./data");
const strings_1 = require("./strings");
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
                const query = util_1.getLang(msg, res);
                const card = await data_1.data.getCard(query.msg, query.lang1);
                if (card) {
                    const profile = await generateCardProfile(card, query.lang2, msg, true);
                    msg.channel.createMessage(profile);
                }
            }
        });
    }
}
exports.cardSearch = cardSearch;
function getColour(card, msg) {
    for (const type in configs_1.colors) {
        if (configs_1.colors.hasOwnProperty(type)) {
            if (card.data.isType(parseInt(type, 16))) {
                return configs_1.colors[type];
            }
        }
    }
    return configs_1.config.getConfig("embedColor").getValue(msg);
}
async function generateCardProfile(card, lang, msg, mobile = false) {
    try {
        let stats = "";
        const setNames = await card.data.names[lang].setcode;
        if (setNames.length > 0) {
            stats += "**" + strings_1.strings.getTranslation("setcode", lang, msg) + "**: " + setNames.join(", ");
        }
        stats += "\n";
        stats += "**" + strings_1.strings.getTranslation("status", lang, msg) + "**: " + (await card.status);
        const price = await card.price;
        if (price) {
            stats +=
                "** " +
                    strings_1.strings.getTranslation("price", lang, msg) +
                    "**: $" +
                    price.low.toFixed(2) +
                    "-$" +
                    price.avg.toFixed(2) +
                    "-$" +
                    price.hi.toFixed(2) +
                    " USD";
        }
        stats += "\n";
        const type = "**" + strings_1.strings.getTranslation("type", lang, msg) + "**: " + card.data.names[lang].typeString;
        stats += type;
        if (card.data.names[lang].attribute.length > 0) {
            stats +=
                " **" +
                    strings_1.strings.getTranslation("attribute", lang, msg) +
                    "**: " +
                    card.data.names[lang].attribute.join("|");
        }
        stats += "\n";
        if (card.data.isType(ygopro_data_1.enums.type.TYPE_MONSTER)) {
            let levelName = strings_1.strings.getTranslation("level", lang, msg);
            if (card.data.isType(ygopro_data_1.enums.type.TYPE_XYZ)) {
                levelName = strings_1.strings.getTranslation("rank", lang, msg);
            }
            else if (card.data.isType(ygopro_data_1.enums.type.TYPE_LINK)) {
                levelName = strings_1.strings.getTranslation("linkRating", lang, msg);
            }
            stats +=
                "**" +
                    levelName +
                    "**: " +
                    card.data.level +
                    " **" +
                    strings_1.strings.getTranslation("atk", lang, msg) +
                    "**: " +
                    (card.data.atk === -2 ? "?" : card.data.atk);
            if (card.data.linkMarker) {
                stats +=
                    " **" + strings_1.strings.getTranslation("linkArrows", lang, msg) + "**: " + card.data.linkMarker.join("");
            }
            else if (card.data.def) {
                stats +=
                    " **" +
                        strings_1.strings.getTranslation("def", lang, msg) +
                        "**: " +
                        (card.data.def === -2 ? "?" : card.data.def);
            }
            stats += "\n";
        }
        let textHeader = strings_1.strings.getTranslation("cardEffect", lang, msg);
        if (card.data.isType(ygopro_data_1.enums.type.TYPE_NORMAL)) {
            textHeader = strings_1.strings.getTranslation("flavourText", lang, msg);
        }
        else if (card.data.isType(ygopro_data_1.enums.type.TYPE_EFFECT)) {
            textHeader = strings_1.strings.getTranslation("monsterEffect", lang, msg);
        }
        const codes = await card.aliasIDs;
        const codeString = codes.join("|");
        if (mobile) {
            const outString = "__**" +
                card.text[lang].name +
                "**__\n**" +
                strings_1.strings.getTranslation("id", lang, msg) +
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
        const outEmbed = {
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
    }
    catch (e) {
        throw e;
    }
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