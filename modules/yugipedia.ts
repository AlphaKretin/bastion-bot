import fetch from "node-fetch";
import { Errors } from "./errors";
export async function getYugipediaPage(query: string): Promise<string> {
	const YUGI_SEARCH =
		"https://yugipedia.com/api.php?action=opensearch&redirects=resolve" +
		"&prop=revisions&rvprop=content&format=json&formatversion=2&search=";
	const fullQuery = YUGI_SEARCH + encodeURIComponent(query);
	try {
		const yugiData = await (await fetch(fullQuery)).json();
		if (yugiData[3][0]) {
			return yugiData[3][0];
		} else {
			throw new Error(Errors.ERROR_YUGI_API);
		}
	} catch (e) {
		throw new Error(Errors.ERROR_YUGI_API);
	}
}

export async function getYugipediaContent(query: string, prop?: string): Promise<string> {
	const YUGI_API =
		"https://yugipedia.com/api.php?action=query&redirects=true" +
		"&prop=revisions&rvprop=content&format=json&formatversion=2&titles=";
	const fullQuery = YUGI_API + encodeURIComponent(query);
	try {
		const yugiData = await (await fetch(fullQuery)).json();
		const page = yugiData.query.pages[0].revisions[0].content;
		if (!prop) {
			return page;
		}
		const propReg = new RegExp("\\| " + prop + "\\s+= (.+?)\\n");
		const regRes = propReg.exec(page);
		if (regRes) {
			return regRes[1];
		}
		throw new Error(Errors.ERROR_YUGI_REGEX);
	} catch (e) {
		throw new Error(Errors.ERROR_YUGI_API);
	}
}
