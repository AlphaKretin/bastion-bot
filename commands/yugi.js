"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const errors_1 = require("../modules/errors");
const util_1 = require("../modules/util");
const yugipedia_1 = require("../modules/yugipedia");
const names = ["yugi", "pedia", "wiki"];
const func = async (msg) => {
    const query = util_1.trimMsg(msg);
    try {
        const url = await yugipedia_1.getYugipediaPage(query);
        return await msg.channel.createMessage(url);
    }
    catch (e) {
        if (e.message === errors_1.Errors.ERROR_YUGI_API) {
            return await msg.channel.createMessage("Sorry, I couldn't find a page for `" + query + "`.");
        }
        else {
            throw e;
        }
    }
};
exports.cmd = new Command_1.Command(names, func);
//# sourceMappingURL=yugi.js.map