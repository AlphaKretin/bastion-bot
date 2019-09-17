"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const data_1 = require("../modules/data");
const util_1 = require("../modules/util");
const names = ["dbfind", "database", "cdb"];
const func = async (msg) => {
    const langs = util_1.getLang(msg);
    const card = await data_1.data.getCard(langs.msg, langs.lang1);
    if (card) {
        return await msg.channel.createMessage("**" + card.text[langs.lang2].name + "**'s entry can be found in: `" + card.dbs.join(", ") + "`.");
    }
    else {
        return await msg.channel.createMessage("Sorry, I can't find a card for `" + langs.msg + "`!");
    }
};
const desc = "Lists all the YGOPro Databases that Bastion is taking the data for a given card from.";
exports.cmd = new Command_1.Command(names, func, undefined, desc, "card");
//# sourceMappingURL=dbfind.js.map