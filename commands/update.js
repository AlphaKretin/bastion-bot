"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const data_1 = require("../modules/data");
const names = ["update"];
async function func(msg) {
    const target = await msg.channel.createMessage("Starting update!");
    try {
        await data_1.data.update();
        target.edit("Update complete!");
        return target;
    }
    catch (e) {
        target.edit("Error!\n" + e.message);
        return target;
    }
}
exports.command = new Command_1.Command(names, func, undefined, true);
//# sourceMappingURL=update.js.map