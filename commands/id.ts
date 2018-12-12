import * as Eris from "eris";
import { bot } from "../modules/bot";
import { Command } from "../modules/Command";
import { data } from "../modules/data";
import { getLang } from "../modules/util";

const names = ["id", "code", "passcode"];
const func = async (msg: Eris.Message): Promise<void> => {
    const langs = getLang(msg);
    try {
        const card = await data.getCard(langs.msg, langs.lang1);
        if (card) {
            await bot.createMessage(msg.channel.id, "**" + card.text[langs.lang2].name + "**: " + card.id);
        } else {
            await bot.createMessage(msg.channel.id, "Sorry, I can't find a card for `" + langs.msg + "`!");
        }
    } catch (e) {
        throw e;
    }
};

export const cmd = new Command(names, func);
