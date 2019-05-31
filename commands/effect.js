"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ygopro_data_1 = require("ygopro-data");
const cardSearch_1 = require("../modules/cardSearch");
const Command_1 = require("../modules/Command");
const data_1 = require("../modules/data");
const strings_1 = require("../modules/strings");
const util_1 = require("../modules/util");
const names = ["eff", "text"];
const func = async (msg, mobile) => {
    const langs = util_1.getLang(msg);
    const card = await data_1.data.getCard(langs.msg, langs.lang1);
    if (card) {
        const codes = await card.aliasIDs;
        const codeString = codes.join(" | ");
        const text = card.text[langs.lang2].desc;
        let msgContent;
        if (mobile) {
            msgContent = "__**" + card.text[langs.lang2].name + "**__\n" + "**ID**: " + codeString + "\n";
            if (text.pendHead) {
                msgContent +=
                    "**" +
                        text.pendHead +
                        "**:\n" +
                        text.pendBody +
                        "\n**" +
                        text.monsterHead +
                        "**:\n" +
                        text.monsterBody;
            }
            else {
                let textHeader = strings_1.strings.getTranslation("cardEffect", langs.lang2, msg);
                if (card.data.isType(ygopro_data_1.enums.type.TYPE_NORMAL)) {
                    textHeader = strings_1.strings.getTranslation("flavourText", langs.lang2, msg);
                }
                else if (card.data.isType(ygopro_data_1.enums.type.TYPE_EFFECT)) {
                    textHeader = strings_1.strings.getTranslation("monsterEffect", langs.lang2, msg);
                }
                msgContent += "**" + textHeader + "**:\n" + text.monsterBody;
            }
        }
        else {
            const embed = {
                color: cardSearch_1.getColour(card, msg),
                footer: { text: codeString },
                thumbnail: { url: card.imageLink },
                title: card.text[langs.lang2].name
            };
            if (text.pendHead) {
                embed.fields = [
                    { name: text.pendHead, value: text.pendBody },
                    { name: text.monsterHead, value: text.monsterBody }
                ];
            }
            else {
                embed.description = text.monsterBody;
            }
            msgContent = { embed };
        }
        try {
            return await msg.channel.createMessage(msgContent);
        }
        catch (e) {
            return await msg.channel.createMessage("Sorry, there was a problem sending the message. " +
                "Maybe the card's text was too long. Try searching for the full profile of **" +
                card.text[langs.lang2].name +
                "**!");
        }
    }
    else {
        return await msg.channel.createMessage("Sorry, I can't find a card for `" + langs.msg + "`!");
    }
};
exports.cmd = new Command_1.Command(names, func);
//# sourceMappingURL=effect.js.map