"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./bot");
const cardSearch_1 = require("./cardSearch");
const data_1 = require("./data");
const errors_1 = require("./errors");
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
    const extra = {
        lang,
        mobile,
        title
    };
    exports.matchPages[msg.channel.id] = new Page_1.Page(msg.author.id, cards, extra);
    const m = await msg.channel.createMessage(generateCardList(msg.channel.id));
    exports.matchPages[msg.channel.id].msg = m;
    if (!(m.channel instanceof Eris.PrivateChannel)) {
        await addMatchButtons(m);
    }
    else {
        await msg.channel.createMessage(errors_1.Errors.ERROR_REACT_FAILURE);
    }
    return m;
}
exports.sendCardList = sendCardList;
function generateCardList(channelID) {
    const page = exports.matchPages[channelID];
    const out = [];
    const cards = page.getSpan();
    let i = 1;
    const extra = page.extra;
    for (const card of cards) {
        out.push(i + page.index + ". " + card.text[extra.lang].name);
        i++;
    }
    const title = extra.title;
    if (title) {
        out.unshift(title.replace(/%s/g, page.length.toString()) + " (Page " + page.currentPage + "/" + page.maxPage + ")");
    }
    return out.join("\n");
}
exports.generateCardList = generateCardList;
let reactionID = 0;
function incrementReactionID() {
    const next = (reactionID + 1) % 100;
    reactionID = next;
}
async function addMatchButtons(msg) {
    const initialID = reactionID;
    const page = exports.matchPages[msg.channel.id];
    if (page.canBack() && reactionID === initialID) {
        await bot_1.addReactionButton(msg, "⬅", async (mes) => {
            incrementReactionID();
            page.back(10);
            const out = generateCardList(msg.channel.id);
            await mes.edit(out);
            await mes.removeReactions();
            await addMatchButtons(msg);
        });
    }
    if (page.canForward(10) && reactionID === initialID) {
        await bot_1.addReactionButton(msg, "➡", async (mes) => {
            incrementReactionID();
            page.forward(10);
            const out = generateCardList(msg.channel.id);
            await mes.edit(out);
            await mes.removeReactions();
            await addMatchButtons(msg);
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
                const extra = page.extra;
                const [profile] = await cardSearch_1.generateCardProfile(card, extra.lang, mes, extra.mobile);
                await mes.edit(profile);
            }
        });
    }
}
exports.addMatchButtons = addMatchButtons;
//# sourceMappingURL=matchPages.js.map