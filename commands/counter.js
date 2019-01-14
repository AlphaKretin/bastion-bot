"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ygopro_data_1 = require("ygopro-data");
const Command_1 = require("../modules/Command");
const util_1 = require("../modules/util");
const names = ["counter"];
const func = async (msg) => {
    try {
        const lang = util_1.getLang(msg);
        let code = await ygopro_data_1.counters.reverseCounter(lang.msg, lang.lang1);
        const tempCode = parseInt(lang.msg, 16);
        if (!isNaN(tempCode) && !code) {
            code = tempCode;
        }
        if (code) {
            const set = await ygopro_data_1.counters.getCounter(code, lang.lang2);
            if (set) {
                msg.channel.createMessage("`0x" + code.toString(16) + "`: " + set);
            }
        }
    }
    catch (e) {
        throw e;
    }
};
exports.cmd = new Command_1.Command(names, func);
//# sourceMappingURL=counter.js.map