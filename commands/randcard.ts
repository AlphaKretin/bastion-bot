import * as Eris from "eris";
import { Filter } from "ygopro-data";
import { sendCardProfile } from "../modules/cardSearch";
import { Command } from "../modules/Command";
import { config } from "../modules/configs";
import { data } from "../modules/data";
import { getRandomIntInclusive, trimMsg } from "../modules/util";

const names: string[] = ["randcard", "randomcard"];

async function func(msg: Eris.Message, mobile: boolean) {
    const content = trimMsg(msg);
    let lang = config.getConfig("defaultLang").getValue(msg);
    for (const term of content.split(/ +/)) {
        if (data.langs.indexOf(term.toLowerCase()) > -1) {
            lang = term.toLowerCase();
        }
    }
    const filter = new Filter(await Filter.parse(content, lang));
    const cards = await data.getCardList();
    const list = filter.filter(cards);
    const ids = Object.keys(list);
    const card = list[Number(ids[getRandomIntInclusive(0, ids.length - 1)])];
    await sendCardProfile(msg, card, lang, mobile);
}

export const command = new Command(names, func);
