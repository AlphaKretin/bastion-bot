import octokit from "@octokit/rest";
import * as fs from "mz/fs";
import fetch from "node-fetch";
import { Command } from "./Command";
export const GitHub = new octokit();

const tempCmds: Command[] = [];

async function downloadCmd(file: any): Promise<void> {
    const fullPath = "./commands/" + file.name;
    const body = await (await fetch(file.download_url)).buffer();
    await fs.writeFile(fullPath, body);
}

export const botOpts = JSON.parse(fs.readFileSync("config/botOpts.json", "utf8"));
botOpts.cmdRepos.forEach(async (repo: any) => {
    const res = await GitHub.repos.getContents(repo);
    for (const file of res.data) {
        if (file.name.endsWith(".js")) {
            try {
                await downloadCmd(file);
            } catch (e) {
                throw e;
            }
        }
    }
});

const files = fs.readdirSync("./commands");
files.forEach(async file => {
    if (file.endsWith(".js")) {
        try {
            const mod = await import("../commands/" + file);
            for (const key in mod) {
                if (mod.hasOwnProperty(key)) {
                    tempCmds.push(mod[key]);
                    console.log("Loaded command " + mod[key].names[0] + "!");
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
});

export const commands: Command[] = tempCmds;
