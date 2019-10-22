"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const commands_1 = require("../modules/commands");
const data_1 = require("../modules/data");
const errors_1 = require("../modules/errors");
const util_1 = require("../modules/util");
const yugipedia_1 = require("../modules/yugipedia");
const names = ["ruling", "ocgdb", "qa"];
const func = async (msg) => {
    const langs = util_1.getLang(msg);
    const card = await data_1.data.getCard(langs.msg, langs.lang1);
    if (!card) {
        return await msg.channel.createMessage("Sorry, I can't find a card for `" + langs.msg + "`!");
    }
    if (commands_1.botOpts.enLangName && commands_1.botOpts.enLangName in card.text) {
        const name = card.text[commands_1.botOpts.enLangName].name;
        try {
            const dbId = await yugipedia_1.getYugipediaContent(name, "database_id");
            const OCG_DB = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&request_locale=ja&cid=";
            return await msg.channel.createMessage("Rulings for `" + card.text[langs.lang2].name + "`: <" + OCG_DB + dbId + ">");
        }
        catch (e) {
            if (!(e.message === errors_1.Errors.ERROR_YUGI_API || e.message === errors_1.Errors.ERROR_YUGI_REGEX)) {
                throw e;
            }
        }
    }
    if (commands_1.botOpts.jaLangName && commands_1.botOpts.jaLangName in card.text) {
        const name = card.text[commands_1.botOpts.jaLangName].name;
        const OCG_URL = "https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=1&sess=1&stype=1" +
            "&othercon=2&request_locale=ja&keyword=";
        return await msg.channel.createMessage("Rulings for `" +
            card.text[langs.lang2].name +
            "`: <" +
            OCG_URL +
            encodeURIComponent(name) +
            ">\nClick the appropriate search result, then the yellow button that reads \"このカードのＱ＆Ａを表示\"");
    }
    return await msg.channel.createMessage("Sorry, I couldn't look up rulings for " +
        card.text[langs.lang2].name +
        "! I need either the English name and a successful connection to Yugipedia, or the Japanese name.");
};
const desc = "Searches for a card by ID or name, and displays a link to the Japanese OCG rulings database for that card";
exports.cmd = new Command_1.Command(names, func, undefined, desc, "card");
//# sourceMappingURL=rulings.js.map