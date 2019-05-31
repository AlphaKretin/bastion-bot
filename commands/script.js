"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const Command_1 = require("../modules/Command");
const commands_1 = require("../modules/commands");
const data_1 = require("../modules/data");
const util_1 = require("../modules/util");
async function downloadCardScript(code, repo) {
    const params = JSON.parse(JSON.stringify(repo)); // clone value
    params.path += "/c" + code + ".lua";
    try {
        const file = await commands_1.GitHub.repos.getContents(params);
        const body = await (await node_fetch_1.default(file.data.download_url)).text();
        return [body, file.data];
    }
    catch (e) {
        return [undefined, undefined];
    }
}
const names = ["script", "lua"];
const func = async (msg, mobile) => {
    const langs = util_1.getLang(msg);
    const card = await data_1.data.getCard(langs.msg, langs.lang1);
    if (card) {
        let script;
        let scriptFile; // Octokit response
        for (const repo of commands_1.botOpts.scriptRepos) {
            [script, scriptFile] = await downloadCardScript(card.id, repo);
            if (script !== undefined && scriptFile !== undefined) {
                break;
            }
        }
        if (script === undefined) {
            return await msg.channel.createMessage("Sorry, I can't find a script for `" + card.text[langs.lang2].name + "`.");
        }
        const scriptSlug = "__" +
            card.text[langs.lang2].name +
            "__\nDirect Link: <" +
            scriptFile.download_url +
            ">\nGitHub Link: <" +
            scriptFile.html_url +
            ">";
        const scriptBody = "```lua\n" + script + "```\n";
        if (mobile || (scriptBody + scriptSlug).length > 2000) {
            return await msg.channel.createMessage(scriptSlug);
        }
        return await msg.channel.createMessage(scriptBody + scriptSlug);
    }
    else {
        return await msg.channel.createMessage("Sorry, I can't find a card for `" + langs.msg + "`!");
    }
};
exports.cmd = new Command_1.Command(names, func);
//# sourceMappingURL=script.js.map