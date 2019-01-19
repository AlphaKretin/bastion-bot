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
const request = require("request-promise-native");
const bot_1 = require("./bot");
const cardSearch_1 = require("./cardSearch");
const configs_1 = require("./configs");
const data_1 = require("./data");
const errors_1 = require("./errors");
const matchPages_1 = require("./matchPages");
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
        throw new Error(errors_1.Errors.ERROR_CONFIG_DM);
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
function numToEmoji(n) {
    if (n > -1 && n < 10) {
        return n.toString() + "\u20e3";
    }
    if (n === 10) {
        return "🔟";
    }
    if (n === 100) {
        return "💯";
    }
}
exports.numToEmoji = numToEmoji;
function generateCardList(serverID, lang, title) {
    const page = matchPages_1.matchPages[serverID];
    const out = [];
    const cards = page.getSpan();
    let i = 1;
    for (const card of cards) {
        out.push(i + page.index + ". " + card.text[lang].name);
        i++;
    }
    if (title) {
        out.unshift(title.replace(/%s/g, (page.length - 1).toString()) + " (Page " + page.currentPage + "/" + page.maxPage + ")");
    }
    return out.join("\n");
}
let reactionID = 0;
function incrementReactionID() {
    const next = (reactionID + 1) % 100;
    reactionID = next;
}
async function addPageButtons(msg, serverID, lang, mobile, title) {
    const initialID = reactionID;
    const page = matchPages_1.matchPages[serverID];
    if (page.canBack() && reactionID === initialID) {
        await bot_1.addReactionButton(msg, "⬅", async (mes) => {
            incrementReactionID();
            page.back(10);
            const out = generateCardList(serverID, lang, title);
            await mes.edit(out);
            await mes.removeReactions();
            await addPageButtons(msg, serverID, lang, mobile, title);
        });
    }
    if (page.canForward(10) && reactionID === initialID) {
        await bot_1.addReactionButton(msg, "➡", async (mes) => {
            incrementReactionID();
            page.forward(10);
            const out = generateCardList(serverID, lang, title);
            await mes.edit(out);
            await mes.removeReactions();
            await addPageButtons(msg, serverID, lang, mobile, title);
        });
    }
    const cards = page.getSpan();
    for (let ind = 0; ind < Math.min(cards.length, 10); ind++) {
        if (reactionID !== initialID) {
            break;
        }
        await bot_1.addReactionButton(msg, numToEmoji(ind + 1), async (mes) => {
            const card = cards[ind];
            if (card) {
                await cardSearch_1.sendCardProfile(mes, card, lang, mobile, false);
            }
        });
    }
}
async function sendCardList(list, lang, msg, title, mobile = false) {
    const hist = [];
    const origCards = Object.values(list);
    const cards = [];
    for (let card of origCards) {
        const ids = await card.aliasIDs;
        if (card.id !== ids[0]) {
            const tempCard = await data_1.data.getCard(ids[0]);
            if (tempCard) {
                card = tempCard;
            }
        }
        if (hist.indexOf(card.id) === -1 && card.text[lang]) {
            cards.push(card);
            hist.push(card.id);
        }
    }
    const chan = msg.channel;
    if (chan instanceof Eris.GuildChannel) {
        const serverID = chan.guild.id;
        matchPages_1.matchPages[serverID] = new matchPages_1.MatchPage(msg.author.id, cards);
        const m = await msg.channel.createMessage(generateCardList(serverID, lang, title));
        await addPageButtons(m, serverID, lang, mobile, title);
    }
}
exports.sendCardList = sendCardList;
async function getYugipediaPage(query) {
    const YUGI_SEARCH = "https://yugipedia.com/api.php?action=opensearch&redirects=resolve" +
        "&prop=revisions&rvprop=content&format=json&formatversion=2&search=";
    const fullQuery = YUGI_SEARCH + encodeURIComponent(query);
    try {
        const result = await request(fullQuery);
        const yugiData = JSON.parse(result);
        if (yugiData[3][0]) {
            return yugiData[3][0];
        }
        else {
            throw new Error(errors_1.Errors.ERROR_YUGI_API);
        }
    }
    catch (e) {
        throw new Error(errors_1.Errors.ERROR_YUGI_API);
    }
}
exports.getYugipediaPage = getYugipediaPage;
async function getYugipediaContent(query, prop) {
    const YUGI_API = "https://yugipedia.com/api.php?action=query&redirects=true" +
        "&prop=revisions&rvprop=content&format=json&formatversion=2&titles=";
    const fullQuery = YUGI_API + encodeURIComponent(query);
    try {
        const result = await request(fullQuery);
        const yugiData = JSON.parse(result);
        const page = yugiData.query.pages[0].revisions[0].content;
        if (!prop) {
            return page;
        }
        const propReg = new RegExp("\\| " + prop + "\\s+= (.+?)\\n");
        const regRes = propReg.exec(page);
        if (regRes) {
            return regRes[1];
        }
        throw new Error(errors_1.Errors.ERROR_YUGI_REGEX);
    }
    catch (e) {
        throw new Error(errors_1.Errors.ERROR_YUGI_API);
    }
}
exports.getYugipediaContent = getYugipediaContent;
//# sourceMappingURL=util.js.map