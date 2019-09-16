import * as Eris from "eris";
import { Command } from "../modules/Command";
import { commands } from "../modules/commands";
import { config } from "../modules/configs";
import { canReact, messageCapSlice } from "../modules/util";

const names: string[] = ["commands"];

async function func(msg: Eris.Message) {
    const prefix = config.getConfig("prefix").getValue(msg);
    const validCommands = commands.filter(c => c.isCanExecute(msg));
    const commandProfiles = validCommands
        .map(c => {
            const base = "`" + prefix + c.names[0] + "`";
            if (c.desc) {
                const d = (typeof c.desc === "string" ? c.desc : c.desc(prefix)).split("\n")[0];
                return base + ": " + d;
            }
            return base;
        })
        .join("\n");
    const outs = messageCapSlice(commandProfiles);
    const chan = await msg.author.getDMChannel();
    for (const out of outs) {
        await chan.createMessage(out);
    }
    if (canReact(msg)) {
        msg.addReaction("📬");
    }
}

const desc = "Generates a list of commands the user has access to.";
export const command = new Command(names, func, undefined, desc);
