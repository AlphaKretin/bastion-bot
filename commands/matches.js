"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Eris = __importStar(require("eris"));
const ygopro_data_1 = require("ygopro-data");
const Command_1 = require("../modules/Command");
const configs_1 = require("../modules/configs");
const data_1 = require("../modules/data");
const matchPages_1 = require("../modules/matchPages");
const util_1 = require("../modules/util");
const names = ["match", "matches"];
async function func(msg, mobile) {
    const content = util_1.trimMsg(msg);
    const a = content.split("|");
    const query = a[0];
    const filterText = a[1];
    let lang = configs_1.config.getConfig("defaultLang").getValue(msg);
    if (filterText) {
        for (const term of filterText.toLowerCase().split(/ +/)) {
            if (data_1.data.langs.includes(term)) {
                lang = term.toLowerCase();
            }
        }
    }
    const result = await data_1.data.getFuseList(query, lang);
    let cards = [];
    if (filterText) {
        const filter = new ygopro_data_1.Filter(await ygopro_data_1.Filter.parse(filterText, lang));
        cards = await filter.simpleFilter(result);
    }
    else {
        for (const c of result) {
            const card = await data_1.data.getCard(c.id);
            if (card) {
                cards.push(card);
            }
        }
    }
    const isDM = msg.channel instanceof Eris.PrivateChannel; // allow anime in DMs because no way to turn it on
    const allowAnime = isDM || configs_1.config.getConfig("allowAnime").getValue(msg);
    const allowCustom = isDM || configs_1.config.getConfig("allowAnime").getValue(msg);
    if (cards.length > 0) {
        if (!allowAnime) {
            cards = cards.filter(c => !c.data.isOT(ygopro_data_1.enums.ot.OT_ANIME) &&
                !c.data.isOT(ygopro_data_1.enums.ot.OT_ILLEGAL) &&
                !c.data.isOT(ygopro_data_1.enums.ot.OT_VIDEO_GAME));
        }
        if (!allowCustom) {
            cards = cards.filter(c => !c.data.isOT(ygopro_data_1.enums.ot.OT_CUSTOM));
        }
        if (cards.length > 0) {
            return await matchPages_1.sendCardList(cards, lang, msg, "Top %s card name fuzzy searches for `" + query + "`", mobile);
        }
    }
    return await msg.channel.createMessage("Sorry, I couldn't find any cards with a name like `" + query + "`!");
}
const desc = (prefix) => "Searches for cards by fuzzy-matching the card name, " +
    "and returns a paginated list of all results.\n" +
    `Use arrow reactions or \`${prefix}mp<number>\` to navigate pages.\n` +
    `Use number reactions or \`${prefix}md<number>\` to show the profile for a card.\n` +
    "For details on the filter system, yell at AlphaKretin to add a link here.";
exports.command = new Command_1.Command(names, func, undefined, desc, "query|filters");
//# sourceMappingURL=matches.js.map