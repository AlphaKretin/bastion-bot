import { Message } from "eris";
import { config } from "./configs";
import * as strs from "../config/strings.json";

class Strings {
	private trans: { [lang: string]: { [prop: string]: string } };
	constructor() {
		this.trans = strs;
	}
	public getTranslation(prop: string, lang: string, msg?: Message, val?: string): string {
		let out: string;
		if (lang in this.trans && prop in this.trans[lang]) {
			out = this.trans[lang][prop];
		} else {
			const def = config.getConfig("defaultLang").getValue(msg);
			out = this.trans[def][prop];
		}
		if (val) {
			out = out.replace(/%s/g, val);
		}
		return out;
	}
}

export const strings = new Strings();
