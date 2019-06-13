import * as Eris from "eris";
import { bot, logDeleteMessage } from "./modules/bot";
import { cardSearch } from "./modules/cardSearch";
import { Command } from "./modules/Command";
import { commands } from "./modules/commands";
import { config } from "./modules/configs";
import { answerTrivia } from "./modules/trivia";

// "handler" for errors that don't matter like reactions
export function ignore(e: any) {
    return;
}

interface ICmdCheck {
    cmd: Command;
    name: string;
}

export const gameData: {
    [channelID: string]: {
        game: string;
        [key: string]: any;
    };
} = {};

async function executeCommand(cmd: Command, name: string, msg: Eris.Message) {
    msg.addReaction("🕙").catch(ignore);
    const m = await cmd.execute(msg, name.endsWith(".m")).catch(async e => {
        msg.channel.createMessage("Error!\n" + e);
        await msg.removeReaction("🕙");
    });
    await msg.removeReaction("🕙").catch(ignore);
    if (m) {
        logDeleteMessage(msg, m);
    }
}

bot.on("messageCreate", async msg => {
    // ignore bots
    if (msg.author.bot) {
        return;
    }
    if (msg.channel.id in gameData) {
        switch (gameData[msg.channel.id].game) {
            case "trivia":
                await answerTrivia(msg).catch(e => msg.channel.createMessage("Error!\n" + e));
        }
        return;
    }
    const content = msg.content.toLowerCase();
    const prefix = config.getConfig("prefix").getValue(msg);
    if (msg.mentions.find(u => u.id === bot.user.id) !== undefined) {
        const cmd = commands.find(c => c.names.includes("help"));
        if (cmd) {
            await executeCommand(cmd, "", msg);
        }
        return;
    }
    const validCmds: ICmdCheck[] = [];
    for (const cmd of commands) {
        for (const name of cmd.names) {
            if (content.startsWith(prefix + name)) {
                validCmds.push({ cmd, name });
            }
        }
    }
    if (validCmds.length > 1) {
        validCmds.sort((a: ICmdCheck, b: ICmdCheck) => b.name.length - a.name.length);
    }
    if (validCmds.length > 0) {
        const cmd = validCmds[0].cmd;
        const cmdName = validCmds[0].name;
        return await executeCommand(cmd, cmdName, msg);
    }
    // because it can send multiple messages, deletion logging for card search
    // is handled in the function, not here
    cardSearch(msg).catch(e => msg.channel.createMessage("Error!\n" + e));
});

// handle some functions on edit
bot.on("messageUpdate", async msg => {
    // ignore bots
    if (msg.author.bot || !msg.content) {
        return;
    }
    const content = msg.content.toLowerCase();
    const prefix = config.getConfig("prefix").getValue(msg);
    const validCmds: ICmdCheck[] = [];
    for (const cmd of commands) {
        if (cmd.onEdit) {
            for (const name of cmd.names) {
                if (content.startsWith(prefix + name)) {
                    validCmds.push({ cmd, name });
                }
            }
        }
    }
    if (validCmds.length > 1) {
        validCmds.sort((a: ICmdCheck, b: ICmdCheck) => b.name.length - a.name.length);
    }
    if (validCmds.length > 0) {
        const cmd = validCmds[0].cmd;
        const cmdName = content.split(/ +/)[0];
        return await executeCommand(cmd, cmdName, msg);
    }
});

bot.connect();
