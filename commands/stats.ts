import * as Eris from "eris";
import { generateCardStats, getColour } from "../modules/cardSearch";
import { Command } from "../modules/Command";
import { data } from "../modules/data";
import { getLang } from "../modules/util";

const names = ["stats", "notext"];
const func = async (msg: Eris.Message, mobile: boolean): Promise<void> => {
    const langs = getLang(msg);
    const card = await data.getCard(langs.msg, langs.lang1);
    if (card) {
        const stats = await generateCardStats(card, langs.lang2, msg);
        const codes = await card.aliasIDs;
        const codeString = codes.join(" | ");
        if (mobile) {
            await msg.channel.createMessage(
                "__**" + card.text[langs.lang2].name + "**__\n" + "**ID**: " + codeString + "\n" + stats
            );
        } else {
            await msg.channel.createMessage({
                embed: {
                    color: getColour(card, msg),
                    description: stats,
                    footer: { text: codeString },
                    thumbnail: { url: card.imageLink },
                    title: card.text[langs.lang2].name
                }
            });
        }
    } else {
        await msg.channel.createMessage("Sorry, I can't find a card for `" + langs.msg + "`!");
    }
};

export const cmd = new Command(names, func);
