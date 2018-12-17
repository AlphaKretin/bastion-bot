"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jimp_1 = __importDefault(require("jimp"));
const ygopro_data_1 = require("ygopro-data");
const commands_1 = require("./commands");
const configs_1 = require("./configs");
const data_1 = require("./data");
const strings_1 = require("./strings");
const util_1 = require("./util");
function reEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}
async function cardSearch(msg) {
    const results = [];
    const fullBrackets = configs_1.config.getConfig("fullBrackets").getValue(msg);
    // strip cases of more than one bracket to minimise conflicts with other bots and spoiler feature
    const badFullRegex = new RegExp(reEscape(fullBrackets[0]) + "{2,}.+?" + reEscape(fullBrackets[1]) + "{2,}");
    let content = msg.content.replace(badFullRegex, "");
    const fullRegex = new RegExp(reEscape(fullBrackets[0]) + "(.+?)" + reEscape(fullBrackets[1]), "g");
    let fullResult = fullRegex.exec(content);
    while (fullResult !== null) {
        results.push({
            image: false,
            mobile: configs_1.config.getConfig("mobileView").getValue(msg),
            res: fullResult[1]
        });
        fullResult = fullRegex.exec(content);
    }
    const mobBrackets = configs_1.config.getConfig("mobBrackets").getValue(msg);
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
    const noImgMobBrackets = configs_1.config.getConfig("noImgMobBrackets").getValue(msg);
    const badNoImgMobRegex = new RegExp(reEscape(noImgMobBrackets[0]) + "{2,}.+?" + reEscape(noImgMobBrackets[1]) + "{2,}");
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
    if (results.length > commands_1.botOpts.maxSearch) {
        const lang = util_1.getLang(msg, results[0].res);
        await msg.channel.createMessage(strings_1.strings.getTranslation("searchCap", lang.lang1, msg, commands_1.botOpts.maxSearch));
        return;
    }
    for (const result of results) {
        const query = util_1.getLang(msg, result.res);
        const card = await data_1.data.getCard(query.msg, query.lang1);
        if (card) {
            const profile = await generateCardProfile(card, query.lang2, msg, result.mobile);
            if (result.mobile && result.image) {
                const image = await getCompositeImage(card);
                if (image) {
                    const file = {
                        file: image,
                        name: card.id.toString() + "." + data_1.imageExt
                    };
                    await msg.channel.createMessage("", file);
                }
            }
            for (const mes of profile) {
                await msg.channel.createMessage(mes);
            }
        }
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
            if (card.data.lscale && card.data.rscale) {
                stats +=
                    " **" +
                        strings_1.strings.getTranslation("scale", lang, msg) +
                        "**: " +
                        card.data.lscale +
                        "/" +
                        card.data.rscale;
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
        const codeString = codes.join(" | ");
        if (mobile) {
            let outString = "__**" +
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
            const outStrings = [];
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
        const outEmbed = {
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
        let descPortion = card.text[lang].desc;
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
        outEmbed.embed.fields.push({
            name: textHeader,
            value: descPortions[0]
        });
        for (let i = 1; i < descPortions.length; i++) {
            outEmbed.embed.fields.push({
                name: "Continued",
                value: descPortions[i]
            });
        }
        return [outEmbed];
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