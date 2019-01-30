"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cardSearch_1 = require("../modules/cardSearch");
const Command_1 = require("../modules/Command");
const data_1 = require("../modules/data");
const util_1 = require("../modules/util");
const names = ["stats", "notext"];
const func = async (msg, mobile) => {
    const langs = util_1.getLang(msg);
    const card = await data_1.data.getCard(langs.msg, langs.lang1);
    if (card) {
        const stats = await cardSearch_1.generateCardStats(card, langs.lang2, msg);
        const codes = await card.aliasIDs;
        const codeString = codes.join(" | ");
        if (mobile) {
            await msg.channel.createMessage("__**" + card.text[langs.lang2].name + "**__\n" + "**ID**: " + codeString + "\n" + stats);
        }
        else {
            return await msg.channel.createMessage({
                embed: {
                    color: cardSearch_1.getColour(card, msg),
                    description: stats,
                    footer: { text: codeString },
                    thumbnail: { url: card.imageLink },
                    title: card.text[langs.lang2].name
                }
            });
        }
    }
    else {
        return await msg.channel.createMessage("Sorry, I can't find a card for `" + langs.msg + "`!");
    }
};
exports.cmd = new Command_1.Command(names, func);
//# sourceMappingURL=stats.js.map