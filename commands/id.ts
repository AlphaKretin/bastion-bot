import * as Eris from "eris";
import { bot } from "../modules/bot";
import { Command } from "../modules/Command";
import { getCardInLang, getLang } from "../modules/util";

const names = ["id", "code", "passcode"];
const func = async (msg: Eris.Message): Promise<void> => {
    const langs = getLang(msg);
    try {
        const card = await getCardInLang(langs);
        if (card) {
            await bot.createMessage(msg.channel.id, "**" + card.name + "**: " + card.code);
        } else {
            await bot.createMessage(msg.channel.id, "Sorry, I can't find a card for `" + langs.msg + "`!");
        }
    } catch (e) {
        throw e;
    }
};

export const cmd = new Command(names, func);
