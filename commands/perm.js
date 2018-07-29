"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Eris = require("eris");
const Command_1 = require("../Command");
const util_1 = require("../util");
function perm(msg, data) {
    return new Promise((resolve, reject) => {
        const m = util_1.trimMsg(msg)
            .toLowerCase()
            .split(/ +/);
        const queryID = m[0];
        const commandName = m[1];
        const cmd = data.commands.find(c => c.names.includes(commandName));
        if (cmd) {
            const chan = msg.channel;
            if (chan instanceof Eris.TextChannel) {
                const guild = chan.guild;
                const role = guild.roles.find(r => r.id === queryID);
                if (role) {
                    cmd.setPermission(guild.id, chan.id, role.id)
                        .then(res => {
                        if (res) {
                            // permission now registered
                            data.bot.createMessage(chan.id, role.name +
                                " now whitelisted for using command " +
                                commandName +
                                " in " +
                                chan.mention +
                                "!");
                        }
                        else {
                            // permission removed
                            data.bot.createMessage(chan.id, role.name +
                                " no longer whitelisted for using command " +
                                commandName +
                                " in " +
                                chan.mention +
                                "!");
                        }
                    })
                        .catch(e => reject(e));
                }
                else {
                    reject("Could not find role with that ID!");
                }
            }
            else {
                reject("Channel is not part of a server, does not support permissions.");
            }
        }
        else {
            reject("Could not find that command!");
        }
    });
}
exports.command = new Command_1.Command(["perm"], perm);
//# sourceMappingURL=perm.js.map