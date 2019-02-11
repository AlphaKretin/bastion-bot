import * as Eris from "eris";
import { Card, Filter } from "ygopro-data";
import { Command } from "../modules/Command";
import { config } from "../modules/configs";
import { data } from "../modules/data";
import { sendCardList } from "../modules/matchPages";
import { trimMsg } from "../modules/util";

const names: string[] = ["match", "matches"];

async function func(msg: Eris.Message, mobile: boolean) {
    const content = trimMsg(msg);
    const a = content.split("|");
    const query = a[0];
    const filterText = a[1];
    let lang = config.getConfig("defaultLang").getValue(msg);
    if (filterText) {
        for (const term of filterText.toLowerCase().split(/ +/)) {
            if (data.langs.indexOf(term) > -1) {
                lang = term.toLowerCase();
            }
        }
    }
    const result = await data.getFuseList(query, lang);
    let cards: Card[] = [];
    if (filterText) {
        const filter = new Filter(await Filter.parse(filterText, lang));
        cards = await filter.simpleFilter(result);
    } else {
        for (const c of result) {
            const card = await data.getCard(c.id);
            if (card) {
                cards.push(card);
            }
        }
    }
    return await sendCardList(cards, lang, msg, "Top %s card name fuzzy searches for `" + query + "`", mobile);
}

export const command = new Command(names, func);
