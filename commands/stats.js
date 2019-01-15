"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("../modules/bot");
const cardSearch_1 = require("../modules/cardSearch");
const Command_1 = require("../modules/Command");
const data_1 = require("../modules/data");
const util_1 = require("../modules/util");
const names = ["stats", "notext"];
const func = async (msg) => {
    const langs = util_1.getLang(msg);
    try {
        const card = await data_1.data.getCard(langs.msg, langs.lang1);
        if (card) {
            const stats = await cardSearch_1.generateCardStats(card, langs.lang2, msg);
            const codes = await card.aliasIDs;
            const codeString = codes.join(" | ");
            await bot_1.bot.createMessage(msg.channel.id, "__**" + card.text[langs.lang2].name + "**__:\n" + "**ID**: " + codeString + "\n" + stats);
        }
        else {
            await bot_1.bot.createMessage(msg.channel.id, "Sorry, I can't find a card for `" + langs.msg + "`!");
        }
    }
    catch (e) {
        throw e;
    }
};
exports.cmd = new Command_1.Command(names, func);
//# sourceMappingURL=stats.js.map