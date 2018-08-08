"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Eris = require("eris");
const configs_1 = require("./configs");
const data_1 = require("./data");
function trimMsg(msg) {
    const m = msg instanceof Eris.Message ? msg.content : msg;
    return m
        .trim()
        .split(/ +/)
        .slice(1)
        .join(" ");
}
exports.trimMsg = trimMsg;
exports.getGuildFromMsg = (msg) => msg.channel instanceof Eris.TextChannel ? msg.channel.guild : undefined;
function getLang(msg) {
    const content = trimMsg(msg);
    const terms = content.split(",");
    if (data_1.data.langs.includes(terms[terms.length - 1])) {
        if (data_1.data.langs.includes(terms[terms.length - 2])) {
            const outM = terms.slice(0, terms.length - 2).join(",");
            return {
                lang1: terms[terms.length - 2],
                lang2: terms[terms.length - 1],
                msg: outM
            };
        }
        else {
            const outM = terms.slice(0, terms.length - 1).join(",");
            return {
                lang1: terms[terms.length - 1],
                lang2: terms[terms.length - 1],
                msg: outM
            };
        }
    }
    else {
        const defLang = configs_1.config.getConfig("defaultLang").getValue(msg);
        return {
            lang1: defLang,
            lang2: defLang,
            msg: content
        };
    }
}
exports.getLang = getLang;
function isILangPayload(arg) {
    return arg.msg !== undefined;
}
async function getCardInLang(query) {
    try {
        const card = await data_1.data.getCard(query.msg, query.lang1);
        if (card && query.lang2 !== query.lang1) {
            return await data_1.data.getCard(card.code, query.lang2);
        }
        return card;
    }
    catch (e) {
        throw e;
    }
}
exports.getCardInLang = getCardInLang;
//# sourceMappingURL=util.js.map