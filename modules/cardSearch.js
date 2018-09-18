"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./bot");
const data_1 = require("./data");
function cardSearch(msg) {
    const re = /{(.+)}/g;
    const result = re.exec(msg.content);
    if (result) {
        result.forEach(async (res, i) => {
            // ignore full match
            if (i > 0) {
                const card = await data_1.data.getCard(res, "en");
                if (card) {
                    bot_1.bot.createMessage(msg.channel.id, generateCardProfile(card));
                }
            }
        });
    }
}
exports.cardSearch = cardSearch;
function generateCardProfile(card) {
    let out = "**ID**: " + card.code + "\n";
    if (card.setNames.length > 0) {
        out += "**Archetype**: " + card.setNames.join(", ");
    }
    out += "\n";
    let type = "**Type**: " + card.typeNames.join("/");
    if (card.raceNames.length > 0) {
        type = type.replace("Monster", card.raceNames.join("|"));
    }
    out += type;
    if (card.attributeNames.length > 0) {
        out += " **Attribute**: " + card.attributeNames.join("|");
    }
    out += "\n";
    if (card.typeNames.includes("Monster")) {
        out += "**Level**: " + card.level + " **ATK**: " + card.atk + " **DEF**: " + card.def + "\n";
    }
    out += "**Card Text**:\n" + card.desc_m;
    return out;
}
//# sourceMappingURL=cardSearch.js.map