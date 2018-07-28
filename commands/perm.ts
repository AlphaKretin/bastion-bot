import * as Eris from "eris";
import { Command, ICommandExpose } from "../Command";
import { trimMsg } from "../util";

async function perm(msg: Eris.Message, data: ICommandExpose): Promise<void> {
    const m = trimMsg(msg)
        .toLowerCase()
        .split(/ +/);
    const queryID = m[0];
    const commandName = m[1];
    const cmd = data.commands.find(c => c.names.includes(commandName));
    if (!cmd) {
        throw new Error("Could not find that command!");
    }
    const chan = msg.channel;
    if (!(chan instanceof Eris.TextChannel)) {
        throw new Error("Channel is not part of a server, does not support permissions.");
    }
    const guild = chan.guild;
    const role = guild.roles.find(r => r.id === queryID);
    if (!role) {
        throw new Error("Could not find role with that ID!");
    }
    const res = await cmd.setPermission(guild.id, chan.id, role.id);
    if (res) {
        // permission now registered
        await data.bot.createMessage(
            chan.id,
            role.name + " now whitelisted for using command " + commandName + " in " + chan.mention + "!"
        );
    } else {
        // permission removed
        await data.bot.createMessage(
            chan.id,
            role.name + " no longer whitelisted for using command " + commandName + " in " + chan.mention + "!"
        );
    }
}

export const command = new Command(["perm"], perm);
