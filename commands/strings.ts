import * as Eris from "eris";
import { Command } from "../modules/Command";
import { data } from "../modules/data";
import { getLang } from "../modules/util";

const names = ["strings"];
const func = async (msg: Eris.Message) => {
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
        if (outs.length > 0) {
            out += outs.join("\n");
        } else {
            out = "There are no strings for `" + card.text[langs.lang2].name + "`!";
        }
        return await msg.channel.createMessage(out);
    } else {
        return await msg.channel.createMessage("Sorry, I can't find a card for `" + langs.msg + "`!");
    }
};

const desc = "Searches for a card by ID or name, and displays its YGOPro database strings.";

export const cmd = new Command(names, func, undefined, desc, "card");
