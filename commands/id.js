"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("../modules/bot");
const Command_1 = require("../modules/Command");
const data_1 = require("../modules/data");
const util_1 = require("../modules/util");
const names = ["id", "code", "passcode"];
const func = async (msg) => {
    const langs = util_1.getLang(msg);
    try {
        const card = await data_1.data.getCard(langs.msg, langs.lang1);
        if (card) {
            await bot_1.bot.createMessage(msg.channel.id, "**" + card.text[langs.lang2].name + "**: " + card.id);
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
//# sourceMappingURL=id.js.map