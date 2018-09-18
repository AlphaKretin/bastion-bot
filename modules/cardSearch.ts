import * as Eris from "eris";
import { Card } from "ygopro-data/dist/Card";
import { bot } from "./bot";
import { data } from "./data";

export function cardSearch(msg: Eris.Message): void {
    const re = /{(.+)}/g;
    const result = re.exec(msg.content);
    if (result) {
        result.forEach(async (res, i) => {
            // ignore full match
            if (i > 0) {
                const card = await data.getCard(res, "en");
                if (card) {
                    bot.createMessage(msg.channel.id, generateCardProfile(card));
                }
            }
        });
    }
}

function generateCardProfile(card: Card): Eris.MessageContent {
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
