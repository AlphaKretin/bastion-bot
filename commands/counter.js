"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ygopro_data_1 = require("ygopro-data");
const Command_1 = require("../modules/Command");
const util_1 = require("../modules/util");
const names = ["counter"];
const func = async (msg) => {
    try {
        const lang = util_1.getLang(msg);
        let counter = parseInt(lang.msg, 16);
        if (isNaN(counter)) {
            counter = await ygopro_data_1.counters.reverseCounter(lang.msg, lang.lang1);
        }
        if (counter) {
            const name = await ygopro_data_1.counters.getCounter(counter, lang.lang2);
            if (name) {
                msg.channel.createMessage("`" + counter.toString(16) + "`:" + name);
            }
        }
    }
    catch (e) {
        throw e;
    }
};
exports.cmd = new Command_1.Command(names, func);
//# sourceMappingURL=counter.js.map