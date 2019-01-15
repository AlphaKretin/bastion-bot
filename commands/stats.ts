import * as Eris from "eris";
import { bot } from "../modules/bot";
import { generateCardStats } from "../modules/cardSearch";
import { Command } from "../modules/Command";
import { data } from "../modules/data";
import { getLang } from "../modules/util";

const names = ["stats", "notext"];
const func = async (msg: Eris.Message): Promise<void> => {
    const langs = getLang(msg);
    try {
        const card = await data.getCard(langs.msg, langs.lang1);
        if (card) {
            const stats = await generateCardStats(card, langs.lang2, msg);
            const codes = await card.aliasIDs;
            const codeString = codes.join(" | ");
            await bot.createMessage(
                msg.channel.id,
                "__**" + card.text[langs.lang2].name + "**__:\n" + "**ID**: " + codeString + "\n" + stats
            );
        } else {
            await bot.createMessage(msg.channel.id, "Sorry, I can't find a card for `" + langs.msg + "`!");
        }
    } catch (e) {
        throw e;
    }
};

export const cmd = new Command(names, func);
