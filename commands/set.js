"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ygopro_data_1 = require("ygopro-data");
const Command_1 = require("../modules/Command");
const util_1 = require("../modules/util");
const names = ["set", "arch"];
const func = async (msg) => {
    const lang = util_1.getLang(msg);
    let code = await ygopro_data_1.setcodes.reverseCode(lang.msg, lang.lang1);
    const tempCode = parseInt(lang.msg, 16);
    if (!isNaN(tempCode) && !code) {
        code = tempCode;
    }
    if (code) {
        const set = await ygopro_data_1.setcodes.getCode(code, lang.lang2);
        if (set) {
            return await msg.channel.createMessage("`0x" + code.toString(16) + "`: " + set);
        }
    }
};
exports.cmd = new Command_1.Command(names, func);
//# sourceMappingURL=set.js.map