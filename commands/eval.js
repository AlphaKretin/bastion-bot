"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const util_1 = require("../modules/util");
const names = ["eval"];
async function go(input) {
    // tslint:disable-next-line:no-eval
    eval(input);
}
async function func(msg) {
    const val = util_1.trimMsg(msg);
    const result = await go(val);
    if (result) {
        if (result instanceof Object) {
            return await msg.channel.createMessage("```json\n" + JSON.stringify(result, null, 4) + "```");
        }
        else {
            return await msg.channel.createMessage(result);
        }
    }
}
exports.command = new Command_1.Command(names, func, undefined, true);
//# sourceMappingURL=eval.js.map