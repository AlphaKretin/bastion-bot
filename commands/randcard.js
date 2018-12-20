"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ygopro_data_1 = require("ygopro-data");
const cardSearch_1 = require("../modules/cardSearch");
const Command_1 = require("../modules/Command");
const configs_1 = require("../modules/configs");
const data_1 = require("../modules/data");
const util_1 = require("../modules/util");
const names = ["randcard", "randomcard"];
async function func(msg, mobile) {
    const content = util_1.trimMsg(msg);
    let lang = configs_1.config.getConfig("defaultLang").getValue(msg);
    let image = false;
    for (const term of content.split(/ +/)) {
        if (data_1.data.langs.indexOf(term.toLowerCase()) > -1) {
            lang = term.toLowerCase();
        }
        if (term === "image") {
            image = true;
        }
    }
    const filter = new ygopro_data_1.Filter(await ygopro_data_1.Filter.parse(content, lang));
    const cards = await data_1.data.getCardList();
    const list = filter.filter(cards);
    const ids = Object.keys(list);
    const card = list[Number(ids[util_1.getRandomIntInclusive(0, ids.length - 1)])];
    await cardSearch_1.sendCardProfile(msg, card, lang, mobile, image);
}
exports.command = new Command_1.Command(names, func);
//# sourceMappingURL=randcard.js.map