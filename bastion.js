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
    const prefix = configs_1.config.getConfig("prefix").getValue(msg);
    if (content.startsWith(prefix + "help") || msg.mentions.find(u => u.id === bot_1.bot.user.id) !== undefined) {
        let out = "I am a Yu-Gi-Oh! card bot made by AlphaKretin#7990.";
        out += "\n";
        out += "Currently, this version of me is undergoing a rework that's still in development. ";
        out += "This is just a preview.";
        out += "\n";
        out += "More thorough documentation will come closer to completion, but for now, you can try searching cards ";
        out += "with the name between `{}` for embed, `<>` for mobile view, or `[]` for mobile view without images.";
        out += "\n";
        out += "I also have a few of my old commands ready, like `.randcard`, `.matches` and `.search`.";
        out += "\n";
        out += "Of course, everything has improvements over my old version. ";
        out += "You can ask Alpha for details if you're curious.";
        out += "\n";
        out += "You can watch my development as it happens, or just support it, ";
        out += "by pledging to Alpha's Patreon at https://www.patreon.com/alphakretinbots.";
        msg.channel.createMessage(out);
    }
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
    if (validCmds.length > 0) {
        const cmd = validCmds[0].cmd;
        const cmdName = validCmds[0].name;
        msg.addReaction("🕙").catch(ignore); // TODO: fix error instead of blackholing it
        const m = await cmd.execute(msg, cmdName.endsWith(".m")).catch(async (e) => {
            msg.channel.createMessage("Error!\n" + e);
            await msg.removeReaction("🕙").catch(ignore);
        });
        await msg.removeReaction("🕙").catch(ignore);
        if (m) {
            bot_1.logDeleteMessage(msg, m);
        }
        return;
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
    const prefix = configs_1.config.getConfig("prefix").getValue(msg);
    const validCmds = [];
    for (const cmd of commands_1.commands) {
        if (cmd.onEdit) {
            for (const name of cmd.names) {
                if (content.startsWith(prefix + name)) {
                    validCmds.push({ cmd, name });
                }
            }
        }
    }
    if (validCmds.length > 1) {
        validCmds.sort((a, b) => b.name.length - a.name.length);
    }
    if (validCmds.length > 0) {
        const cmd = validCmds[0].cmd;
        const cmdName = content.split(/ +/)[0];
        msg.addReaction("🕙").catch(ignore); // TODO: fix error instead of blackholing it
        const m = await cmd.execute(msg, cmdName.endsWith(".m")).catch(async (e) => {
            msg.channel.createMessage("Error!\n" + e);
            await msg.removeReaction("🕙").catch(ignore);
        });
        await msg.removeReaction("🕙").catch(ignore);
        if (m) {
            bot_1.logDeleteMessage(msg, m);
        }
        return;
    }
});
bot_1.bot.connect();
//# sourceMappingURL=bastion.js.map