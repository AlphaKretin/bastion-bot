"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Eris = __importStar(require("eris"));
const Command_1 = require("../modules/Command");
const commands_1 = require("../modules/commands");
const util_1 = require("../modules/util");
async function perm(msg) {
    const m = util_1.trimMsg(msg)
        .toLowerCase()
        .split(/ +/);
    const queryID = m[0];
    const commandName = m[1];
    const cmd = commands_1.commands.find(c => c.names.includes(commandName));
    if (!cmd) {
        throw new Error("Could not find that command!");
    }
    const chan = msg.channel;
    if (!(chan instanceof Eris.TextChannel)) {
        throw new Error("Channel is not part of a server, does not support permissions.");
    }
    const guild = chan.guild;
    const role = guild.roles.find(r => r.id === queryID || r.name.toLowerCase() === queryID.toLowerCase());
    if (!role) {
        throw new Error("Could not find role with that ID!");
    }
    const res = await cmd.setPermission(guild.id, chan.id, role.id);
    if (res) {
        // permission now registered
        return await chan.createMessage(role.name + " now whitelisted for using command " + commandName + " in " + chan.mention + "!");
    }
    else {
        // permission removed
        return await chan.createMessage(role.name + " no longer whitelisted for using command " + commandName + " in " + chan.mention + "!");
    }
}
const desc = "edits permissions? this command should be overhauled yell at AlphaKretin";
exports.command = new Command_1.Command(["perm"], perm, undefined, desc);
//# sourceMappingURL=perm.js.map