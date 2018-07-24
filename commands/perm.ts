import * as Eris from "eris";
import { Command, ICommandExpose } from "../Command";
import { trimMsg } from "../util";

function perm(msg: Eris.Message, data: ICommandExpose): Promise<void> {
    return new Promise((resolve, reject) => {
        const m = trimMsg(msg)
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
                        .then(() => resolve())
                        .catch(e => reject(e));
                } else {
                    reject("Could not find role with that ID!");
                }
            } else {
                reject("Channel is not part of a server, does not support permissions.");
            }
        } else {
            reject("Could not find that command!");
        }
    });
}

export const command = new Command(["perm"], perm);
