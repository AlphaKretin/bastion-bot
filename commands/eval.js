"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const util = __importStar(require("util"));
const Command_1 = require("../modules/Command");
const data_1 = require("../modules/data");
const util_1 = require("../modules/util");
// make import used so it's not optimised out
function getData() {
    return data_1.data;
}
const names = ["eval"];
async function func(msg) {
    const val = util_1.trimMsg(msg);
    let evaled;
    try {
        // tslint:disable-next-line:no-eval
        evaled = await eval(val);
    }
    catch (e) {
        evaled = e;
    }
    const output = util.inspect(evaled, true, 5, false);
    return await msg.channel.createMessage("```json\n" + output + "```");
}
exports.command = new Command_1.Command(names, func, undefined, undefined, undefined, true);
//# sourceMappingURL=eval.js.map