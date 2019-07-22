import * as Eris from "eris";
import { Command } from "../modules/Command";
import { botOpts } from "../modules/commands";
import { data } from "../modules/data";
import { Errors } from "../modules/errors";
import { getLang } from "../modules/util";
import { getYugipediaContent } from "../modules/yugipedia";

const names = ["ruling", "ocgdb", "qa"];
const func = async (msg: Eris.Message) => {
    const langs = await getLang(msg);
    const card = await data.getCard(langs.msg, langs.lang1);
    if (!card) {
        return await msg.channel.createMessage("Sorry, I can't find a card for `" + langs.msg + "`!");
    }
    if (botOpts.enLangName && botOpts.enLangName in card.text) {
        const name = card.text[botOpts.enLangName].name;
        try {
            const dbId = await getYugipediaContent(name, "database_id");
            const OCG_DB = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&request_locale=ja&cid=";
            return await msg.channel.createMessage(
                "Rulings for `" + card.text[langs.lang2].name + "`: <" + OCG_DB + dbId + ">"
            );
        } catch (e) {
            if (!(e.message === Errors.ERROR_YUGI_API || e.message === Errors.ERROR_YUGI_REGEX)) {
                throw e;
            }
        }
    }
    if (botOpts.jaLangName && botOpts.jaLangName in card.text) {
        const name = card.text[botOpts.jaLangName].name;
        const OCG_URL =
            "https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=1&sess=1&stype=1" +
            "&othercon=2&request_locale=ja&keyword=";

        return await msg.channel.createMessage(
            "Rulings for `" +
                card.text[langs.lang2].name +
                "`: <" +
                OCG_URL +
                encodeURIComponent(name) +
                '>\nClick the appropriate search result, then the yellow button that reads "このカードのＱ＆Ａを表示"'
        );
    }
    return await msg.channel.createMessage(
        "Sorry, I couldn't look up rulings for " +
            card.text[langs.lang2].name +
            "! I need either the English name and a successful connection to Yugipedia, or the Japanese name."
    );
};

const desc =
    "Searches for a card by ID or name, and displays a link to the Japanese OCG rulings database for that card";

export const cmd = new Command(names, func, undefined, desc, "card");
