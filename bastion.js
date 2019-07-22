"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./modules/bot");
const cardSearch_1 = require("./modules/cardSearch");
const commands_1 = require("./modules/commands");
const configs_1 = require("./modules/configs");
const trivia_1 = require("./modules/trivia");
// "handler" for errors that don't matter like reactions
function ignore(e) {
    return;
}
exports.ignore = ignore;
exports.gameData = {};
async function executeCommand(cmd, name, msg) {
    msg.addReaction("🕙").catch(ignore);
    const m = await cmd.execute(msg, name.endsWith(".m")).catch(async (e) => {
        msg.channel.createMessage("Error!\n" + e);
        await msg.removeReaction("🕙");
    });
    await msg.removeReaction("🕙").catch(ignore);
    if (m) {
        bot_1.logDeleteMessage(msg, m);
    }
}
function getMatchingCommands(msg, query, usePref = true) {
    const prefix = usePref ? configs_1.config.getConfig("prefix").getValue(msg) : "";
    const content = query || msg.content.toLowerCase();
    const validCmds = [];
    for (const cmd of commands_1.commands) {
        for (const name of cmd.names) {
            if (content.startsWith(prefix + name)) {
                validCmds.push({ cmd, name });
            }
        }
    }
    if (validCmds.length > 1) {
        validCmds.sort((a, b) => b.name.length - a.name.length);
    }
    return validCmds;
}
exports.getMatchingCommands = getMatchingCommands;
bot_1.bot.on("messageCreate", async (msg) => {
    // ignore bots
    if (msg.author.bot) {
        return;
    }
    if (msg.channel.id in exports.gameData) {
        switch (exports.gameData[msg.channel.id].game) {
            case "trivia":
                await trivia_1.answerTrivia(msg).catch(e => msg.channel.createMessage("Error!\n" + e));
        }
        return;
    }
    const content = msg.content.toLowerCase();
    if (msg.mentions.find(u => u.id === bot_1.bot.user.id) !== undefined) {
        const cmd = commands_1.commands.find(c => c.names.includes("help"));
        if (cmd) {
            await executeCommand(cmd, "", msg);
        }
        return;
    }
    const validCmds = getMatchingCommands(msg);
    if (validCmds.length > 0) {
        const cmd = validCmds[0].cmd;
        const cmdName = validCmds[0].name;
        return await executeCommand(cmd, cmdName, msg);
    }
    // because it can send multiple messages, deletion logging for card search
    // is handled in the function, not here
    cardSearch_1.cardSearch(msg).catch(e => msg.channel.createMessage("Error!\n" + e));
});
// handle some functions on edit
bot_1.bot.on("messageUpdate", async (msg) => {
    // ignore bots
    if (msg.author.bot || !msg.content) {
        return;
    }
    const content = msg.content.toLowerCase();
    const validCmds = getMatchingCommands(msg).filter(c => c.cmd.onEdit);
    if (validCmds.length > 0) {
        const cmd = validCmds[0].cmd;
        const cmdName = content.split(/ +/)[0];
        return await executeCommand(cmd, cmdName, msg);
    }
});
bot_1.bot.connect();
//# sourceMappingURL=bastion.js.map