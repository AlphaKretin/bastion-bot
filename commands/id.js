"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const data_1 = require("../modules/data");
const util_1 = require("../modules/util");
const names = ["id", "code", "passcode"];
const func = async (msg) => {
    const langs = util_1.getLang(msg);
    const card = await data_1.data.getCard(langs.msg, langs.lang1);
    if (card) {
        return await msg.channel.createMessage("**" + card.text[langs.lang2].name + "**: " + card.id);
    }
    else {
        return await msg.channel.createMessage("Sorry, I can't find a card for `" + langs.msg + "`!");
    }
};
const desc = "Searches for a card by ID or name, and shows both without any extra info.\n" +
    "Besides the obvious, useful for quick name translations, since all card searches support language options.";
exports.cmd = new Command_1.Command(names, func, undefined, desc, "card");
//# sourceMappingURL=id.js.map