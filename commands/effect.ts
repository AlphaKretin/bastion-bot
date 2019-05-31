import * as Eris from "eris";
import { enums } from "ygopro-data";
import { getColour } from "../modules/cardSearch";
import { Command } from "../modules/Command";
import { data } from "../modules/data";
import { strings } from "../modules/strings";
import { getLang } from "../modules/util";

const names = ["eff", "text"];
const func = async (msg: Eris.Message, mobile: boolean) => {
    const langs = getLang(msg);
    const card = await data.getCard(langs.msg, langs.lang1);
    if (card) {
        const codes = await card.aliasIDs;
        const codeString = codes.join(" | ");
        const text = card.text[langs.lang2].desc;
        let msgContent: Eris.MessageContent;
        if (mobile) {
            msgContent = "__**" + card.text[langs.lang2].name + "**__\n" + "**ID**: " + codeString + "\n";
            if (text.pendHead) {
                msgContent +=
                    "**" +
                    text.pendHead +
                    "**:\n" +
                    text.pendBody! +
                    "\n**" +
                    text.monsterHead! +
                    "**:\n" +
                    text.monsterBody;
            } else {
                let textHeader = strings.getTranslation("cardEffect", langs.lang2, msg);
                if (card.data.isType(enums.type.TYPE_NORMAL)) {
                    textHeader = strings.getTranslation("flavourText", langs.lang2, msg);
                } else if (card.data.isType(enums.type.TYPE_EFFECT)) {
                    textHeader = strings.getTranslation("monsterEffect", langs.lang2, msg);
                }
                msgContent += "**" + textHeader + "**:\n" + text.monsterBody;
            }
        } else {
            const embed: Eris.EmbedOptions = {
                color: getColour(card, msg),
                footer: { text: codeString },
                thumbnail: { url: card.imageLink },
                title: card.text[langs.lang2].name
            };
            if (text.pendHead) {
                embed.fields = [
                    { name: text.pendHead, value: text.pendBody! },
                    { name: text.monsterHead!, value: text.monsterBody }
                ];
            } else {
                embed.description = text.monsterBody;
            }
            msgContent = { embed };
        }
        try {
            return await msg.channel.createMessage(msgContent);
        } catch (e) {
            return await msg.channel.createMessage(
                "Sorry, there was a problem sending the message. " +
                    "Maybe the card's text was too long. Try searching for the full profile of **" +
                    card.text[langs.lang2].name +
                    "**!"
            );
        }
    } else {
        return await msg.channel.createMessage("Sorry, I can't find a card for `" + langs.msg + "`!");
    }
};

export const cmd = new Command(names, func);
