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
        const data = file.data;
        if (data.download_url) {
            const body = await (await node_fetch_1.default(data.download_url)).text();
            return [body, data];
        }
        return [undefined, undefined];
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
        if (script === undefined || scriptFile === undefined) {
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
const desc = "Searches for a card by ID or name, and displays a link to its card script on GitHub if available. " +
    "Also displays the script in Discord if it's short enough to fit in the message";
exports.cmd = new Command_1.Command(names, func, undefined, desc, "card");
//# sourceMappingURL=script.js.map