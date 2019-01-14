import * as Eris from "eris";
import { counters } from "ygopro-data";
import { Command } from "../modules/Command";
import { getLang } from "../modules/util";

const names = ["counter"];
const func = async (msg: Eris.Message): Promise<void> => {
    try {
        const lang = getLang(msg);
        let counter: number | undefined = parseInt(lang.msg, 16);
        if (isNaN(counter)) {
            counter = await counters.reverseCounter(lang.msg, lang.lang1);
        }
        if (counter) {
            const name = await counters.getCounter(counter, lang.lang2);
            if (name) {
                msg.channel.createMessage("`" + counter.toString(16) + "`:" + name);
            }
        }
    } catch (e) {
        throw e;
    }
};

export const cmd = new Command(names, func);
