"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const octokit = require("@octokit/rest");
const fs = require("mz/fs");
const request = require("request-promise-native");
const GitHub = new octokit();
const tempCmds = [];
async function downloadCmd(file) {
    const fullPath = "./commands/" + file.name;
    const body = await request({
        encoding: null,
        url: file.download_url
    });
    await fs.writeFile(fullPath, body);
}
const botOpts = JSON.parse(fs.readFileSync("config/botOpts.json", "utf8"));
botOpts.cmdRepos.forEach(async (repo) => {
    const res = await GitHub.repos.getContent(repo);
    for (const file of res.data) {
        if (file.name.endsWith(".js")) {
            try {
                await downloadCmd(file);
            }
            catch (e) {
                throw e;
            }
        }
    }
});
const files = fs.readdirSync("./commands");
files.forEach(async (file) => {
    if (file.endsWith(".js")) {
        try {
            const mod = await Promise.resolve().then(() => require("../commands/" + file));
            for (const key in mod) {
                if (mod.hasOwnProperty(key)) {
                    tempCmds.push(mod[key]);
                    console.log("Loaded command " + mod[key].names[0] + "!");
                }
            }
        }
        catch (e) {
            console.error(e);
        }
    }
});
exports.commands = tempCmds;
//# sourceMappingURL=commands.js.map