import { Octokit } from "@octokit/rest";
import { Message } from "eris";
import fetch from "node-fetch";
import { Command } from "../modules/Command";
import { data } from "../modules/data";
import { getLang } from "../modules/util";
import { scriptRepos } from "../config/botOpts.json";

const auth = process.env.GITHUB_TOKEN;
let GitHub: Octokit;
if (auth) {
	GitHub = new Octokit({
		auth
	});
} else {
	GitHub = new Octokit();
}
type gitParams = {
	owner: string;
	repo: string;
	path: string;
}; // hardcode instead of extracted with Parameters<> because of undefined confusion
type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;
type Unpacked<T> = T extends (infer U)[] ? U : T;
type gitResponse = Unpacked<ThenArg<ReturnType<typeof GitHub.repos.getContent>>["data"]>;

async function downloadCardScript(
	code: number,
	repo: gitParams
): Promise<[string | undefined, gitResponse | undefined]> {
	const params: gitParams = JSON.parse(JSON.stringify(repo)); // clone value
	params.path += "/c" + code + ".lua";
	try {
		const file = await GitHub.repos.getContent(params);
		const baseData = file.data;
		const data = baseData instanceof Array ? baseData[0] : baseData;
		if (data.download_url) {
			const body: string = await (await fetch(data.download_url)).text();
			return [body, data];
		}
		return [undefined, undefined];
	} catch (e) {
		return [undefined, undefined];
	}
}

const names = ["script", "lua"];
const func = async (msg: Message, mobile: boolean): Promise<Message> => {
	const langs = getLang(msg);
	const card = await data.getCard(langs.msg, langs.lang1);
	if (card) {
		let script: string | undefined;
		let scriptFile: gitResponse | undefined; // Octokit response
		for (const repo of scriptRepos) {
			[script, scriptFile] = await downloadCardScript(card.id, repo);
			if (script !== undefined && scriptFile !== undefined) {
				break;
			}
		}
		if (script === undefined || scriptFile === undefined) {
			return await msg.channel.createMessage("Sorry, I can't find a script for `" + card.text[langs.lang2].name + "`.");
		}
		const scriptSlug =
			"__" +
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
	} else {
		return await msg.channel.createMessage("Sorry, I can't find a card for `" + langs.msg + "`!");
	}
};

const desc =
	"Searches for a card by ID or name, and displays a link to its card script on GitHub if available. " +
	"Also displays the script in Discord if it's short enough to fit in the message";

export const command = new Command(names, func, undefined, desc, "card");
