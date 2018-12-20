"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Eris = __importStar(require("eris"));
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
exports.getGuildFromMsg = (msg) => {
    if (!(msg.channel instanceof Eris.TextChannel)) {
        throw new Error("Config set in DMs!");
    }
    return msg.channel.guild;
};
function getLang(msg, query) {
    const content = query || trimMsg(msg);
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
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.getRandomIntInclusive = getRandomIntInclusive;
async function sendCardList(list, lang, msg, count = configs_1.config.getConfig("listDefault").getValue(msg), title) {
    const out = [];
    const hist = [];
    const cards = Object.values(list);
    let i = 1;
    let j = 0;
    while (i <= count && j < cards.length) {
        let card = cards[j];
        const ids = await card.aliasIDs;
        if (card.id !== ids[0]) {
            const tempCard = await data_1.data.getCard(ids[0]);
            if (tempCard) {
                card = tempCard;
            }
        }
        if (hist.indexOf(card.id) === -1 && card.text[lang]) {
            out.push(i + ". " + card.text[lang].name);
            hist.push(card.id);
            i++;
        }
        j++;
    }
    if (title) {
        out.unshift(title.replace(/%s/g, (i - 1).toString()));
    }
    msg.channel.createMessage(out.join("\n"));
}
exports.sendCardList = sendCardList;
//# sourceMappingURL=util.js.map