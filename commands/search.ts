import * as Eris from "eris";
import { Card, Filter } from "ygopro-data";
import { Command } from "../modules/Command";
import { config } from "../modules/configs";
import { data } from "../modules/data";
import { sendCardList, trimMsg } from "../modules/util";

const names: string[] = ["search", "textsearch"];

async function func(msg: Eris.Message, mobile: boolean) {
    const content = trimMsg(msg);
    const a = content.split("|");
    const query = a[0].trim().toLowerCase();
    const filterText = a[1];
    let lang = config.getConfig("defaultLang").getValue(msg);
    if (filterText) {
        for (const term of filterText.split(/ +/)) {
            if (data.langs.indexOf(term.toLowerCase()) > -1) {
                lang = term.toLowerCase();
            }
        }
    }
    let cards: Card[] = [];
    const fullList = await data.getCardList();
    for (const code in fullList) {
        if (fullList.hasOwnProperty(code)) {
            const text = fullList[code].text[lang];
            if (
                text &&
                (text.name.toLowerCase().includes(query) ||
                    text.desc.monsterBody.toLowerCase().includes(query) ||
                    (text.desc.pendBody && text.desc.pendBody.toLowerCase().includes(query)))
            ) {
                cards.push(fullList[code]);
            }
        }
    }
    if (filterText) {
        const filter = new Filter(await Filter.parse(filterText, lang));
        cards = filter.filter(cards);
    }
    await sendCardList(cards, lang, msg, "Top %s card text matches for `" + query + "`:", mobile);
}

export const command = new Command(names, func);
