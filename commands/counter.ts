import * as Eris from "eris";
import { counters } from "ygopro-data";
import { Command } from "../modules/Command";
import { getLang } from "../modules/util";

const names = ["counter"];
const func = async (msg: Eris.Message) => {
    const lang = getLang(msg);
    let code = await counters.reverseCounter(lang.msg, lang.lang1);
    const tempCode = parseInt(lang.msg, 16);
    if (!isNaN(tempCode) && !code) {
        code = tempCode;
    }
    if (code) {
        const set = await counters.getCounter(code, lang.lang2);
        if (set) {
            return await msg.channel.createMessage("`0x" + code.toString(16) + "`: " + set);
        }
    }
};

const desc = "Searches for a Counter (e.g., Bushido Counter) by name or YGOPro hexadecimal value, and displays both";

export const cmd = new Command(names, func, undefined, desc, "name|value");
