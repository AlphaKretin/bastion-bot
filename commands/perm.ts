import * as Eris from "eris";
import { Command } from "../modules/Command";
import { commands } from "../modules/commands";
import { trimMsg } from "../modules/util";

async function perm(msg: Eris.Message) {
    const m = trimMsg(msg)
        .toLowerCase()
        .split(/ +/);
    const queryID = m[0];
    const commandName = m[1];
    const cmd = commands.find(c => c.names.includes(commandName));
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
        return await chan.createMessage(
            role.name + " now whitelisted for using command " + commandName + " in " + chan.mention + "!"
        );
    } else {
        // permission removed
        return await chan.createMessage(
            role.name + " no longer whitelisted for using command " + commandName + " in " + chan.mention + "!"
        );
    }
}

const desc = "edits permissions? this command should be overhauled yell at AlphaKretin";

export const command = new Command(["perm"], perm, undefined, desc);
