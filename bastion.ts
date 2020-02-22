import * as Eris from "eris";
import { bot, logDeleteMessage } from "./modules/bot";
import { cardSearch } from "./modules/cardSearch";
import { Command } from "./modules/Command";
import { commands } from "./modules/commands";
import { config } from "./modules/configs";
import { answerTrivia } from "./modules/trivia";

// "handler" for errors that don't matter like reactions
export function ignore(): void {
	return;
}

interface CmdCheck {
	cmd: Command;
	name: string;
}

export const gameData: {
	[channelID: string]: {
		game: string;
		// any allowed because it's uncertain data store
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any;
	};
} = {};

async function executeCommand(cmd: Command, name: string, msg: Eris.Message, mobile = false, edit = false): Promise<void> {
	msg.addReaction("🕙").catch(ignore);
	const m = await cmd.execute(msg, mobile, edit).catch(async e => {
		msg.channel.createMessage("Error!\n" + e);
		await msg.removeReaction("🕙");
	});
	await msg.removeReaction("🕙").catch(ignore);
	if (m) {
		logDeleteMessage(msg, m);
	}
}

export function getMatchingCommands(msg: Eris.Message, query?: string, usePref = true): CmdCheck[] {
	const prefix = usePref ? config.getConfig("prefix").getValue(msg) : "";
	const content = query || msg.content.toLowerCase();
	const validCmds: CmdCheck[] = [];
	for (const cmd of commands) {
		for (const name of cmd.names) {
			if (content.startsWith(prefix + name)) {
				validCmds.push({ cmd, name });
			}
		}
	}
	if (validCmds.length > 1) {
		validCmds.sort((a: CmdCheck, b: CmdCheck) => b.name.length - a.name.length);
	}
	return validCmds;
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
	if (msg.mentions.find(u => u.id === bot.user.id) !== undefined) {
		const cmd = commands.find(c => c.names.includes("help"));
		if (cmd) {
			await executeCommand(cmd, "", msg);
		}
		return;
	}
	const validCmds = getMatchingCommands(msg);
	if (validCmds.length > 0) {
		const cmd = validCmds[0].cmd;
		const cmdName = validCmds[0].name;
		return await executeCommand(cmd, cmdName, msg, msg.content.split(/\s+/)[0].endsWith(".m"));
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
	const validCmds = getMatchingCommands(msg).filter(c => c.cmd.onEdit);
	if (validCmds.length > 0) {
		const cmd = validCmds[0].cmd;
		const cmdName = content.split(/ +/)[0];
		return await executeCommand(cmd, cmdName, msg, false, true);
	}
});

bot.connect().then(() => {
	bot.editStatus(undefined, {
		name: "New update, .help!"
	});
}).catch(e => console.error(e));
