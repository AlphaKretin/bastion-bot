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
const bot_1 = require("./bot");
const cardSearch_1 = require("./cardSearch");
const data_1 = require("./data");
const Page_1 = require("./Page");
const util_1 = require("./util");
exports.matchPages = {};
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
    exports.matchPages[msg.channel.id] = new Page_1.Page(msg.author.id, cards);
    const m = await msg.channel.createMessage(generateCardList(msg.channel.id, lang, title));
    if (!(m.channel instanceof Eris.PrivateChannel)) {
        await addMatchButtons(m, lang, mobile, title);
    }
    return m;
}
exports.sendCardList = sendCardList;
function generateCardList(channelID, lang, title) {
    const page = exports.matchPages[channelID];
    const out = [];
    const cards = page.getSpan();
    let i = 1;
    for (const card of cards) {
        out.push(i + page.index + ". " + card.text[lang].name);
        i++;
    }
    if (title) {
        out.unshift(title.replace(/%s/g, page.length.toString()) + " (Page " + page.currentPage + "/" + page.maxPage + ")");
    }
    return out.join("\n");
}
let reactionID = 0;
function incrementReactionID() {
    const next = (reactionID + 1) % 100;
    reactionID = next;
}
async function addMatchButtons(msg, lang, mobile, title) {
    const initialID = reactionID;
    const page = exports.matchPages[msg.channel.id];
    if (page.canBack() && reactionID === initialID) {
        await bot_1.addReactionButton(msg, "⬅", async (mes) => {
            incrementReactionID();
            page.back(10);
            const out = generateCardList(msg.channel.id, lang, title);
            await mes.edit(out);
            await mes.removeReactions();
            await addMatchButtons(msg, lang, mobile, title);
        });
    }
    if (page.canForward(10) && reactionID === initialID) {
        await bot_1.addReactionButton(msg, "➡", async (mes) => {
            incrementReactionID();
            page.forward(10);
            const out = generateCardList(msg.channel.id, lang, title);
            await mes.edit(out);
            await mes.removeReactions();
            await addMatchButtons(msg, lang, mobile, title);
        });
    }
    const cards = page.getSpan();
    for (let ind = 0; ind < Math.min(cards.length, 10); ind++) {
        if (reactionID !== initialID) {
            break;
        }
        await bot_1.addReactionButton(msg, util_1.numToEmoji(ind + 1), async (mes) => {
            const card = cards[ind];
            if (card) {
                await cardSearch_1.sendCardProfile(mes, card, lang, mobile, false);
            }
        });
    }
}
//# sourceMappingURL=matchPages.js.map