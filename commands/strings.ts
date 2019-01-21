import * as Eris from "eris";
import { generateCardStats, getColour } from "../modules/cardSearch";
import { Command } from "../modules/Command";
import { data } from "../modules/data";
import { getLang } from "../modules/util";

const names = ["strings"];
const func = async (msg: Eris.Message): Promise<void> => {
    const langs = getLang(msg);
    const card = await data.getCard(langs.msg, langs.lang1);
    if (card) {
        let out = "Strings for __**" + card.text[langs.lang2].name + "**__:\n";
        const outs = [];
        const strings = card.text[langs.lang2].strings;
        for (let i = 0; i < strings.length; i++) {
            const str = strings[i];
            if (str.trim().length > 0) {
                outs.push(i + ": `" + str + "`");
            }
        }
        out += outs.join("\n");
        await msg.channel.createMessage(out);
    } else {
        await msg.channel.createMessage("Sorry, I can't find a card for `" + langs.msg + "`!");
    }
};

export const cmd = new Command(names, func);
