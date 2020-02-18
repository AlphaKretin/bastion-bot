"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const stats_1 = require("../modules/stats");
const configs_1 = require("../modules/configs");
const util_1 = require("../modules/util");
const data_1 = require("../modules/data");
const names = ["top"];
const func = async (msg) => {
    let lang = configs_1.config.getConfig("defaultLang").getValue(msg);
    const args = util_1.trimMsg(msg).split(" ");
    for (const arg of args) {
        if (data_1.data.langs.includes(arg)) {
            lang = arg;
        }
    }
    // arbitrary limit - fewer isn't interesting enough, more is too big output, finer details can just be queried for by me
    const tops = await stats_1.stats.topCards(15);
    const lines = [];
    for (let i = 0; i < tops.length; i++) {
        const code = tops[i].result;
        const count = tops[i].times;
        let name = code.toString();
        const card = await data_1.data.getCard(code, undefined, true, true);
        if (card && lang in card.text) {
            name = card.text[lang].name;
        }
        lines.push(`${i + 1}. ${name} (${count} times)`);
    }
    return await msg.channel.createMessage("__Top " + lines.length + " card searches__:\n" + lines.join("\n"));
};
const desc = "Displays the cards most popular to search for, up to the top 15.";
exports.cmd = new Command_1.Command(names, func, undefined, desc, "lang");
//# sourceMappingURL=top.js.map