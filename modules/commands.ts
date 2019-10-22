import octokit from "@octokit/rest";
import * as fs from "mz/fs";
import fetch from "node-fetch";
import { Command } from "./Command";
export const GitHub = new octokit();

const tempCmds: Command[] = [];

async function downloadCmd(file: octokit.ReposGetContentsResponseItem): Promise<void> {
	const fullPath = "./commands/" + file.name;
	if (file.download_url) {
		const body = await (await fetch(file.download_url)).buffer();
		await fs.writeFile(fullPath, body);
	}
}

export const botOpts = JSON.parse(fs.readFileSync("config/botOpts.json", "utf8"));
botOpts.cmdRepos.forEach(async (repo: octokit.ReposGetContentsParams) => {
	const res = await GitHub.repos.getContents(repo);
	for (const file of res) {
		if (file.data.name.endsWith(".js")) {
			await downloadCmd(file);
		}
	}
});

const files = fs.readdirSync("./commands");
files.forEach(async file => {
	if (file.endsWith(".js")) {
		try {
			const mod = await import("../commands/" + file);
			for (const key in mod) {
				tempCmds.push(mod[key]);
				console.log("Loaded command " + mod[key].names[0] + "!");
			}
		} catch (e) {
			console.error(e);
		}
	}
});

export const commands: Command[] = tempCmds;
