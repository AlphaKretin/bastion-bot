/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from "mz/fs";
import { ConfigOption } from "./ConfigOption";
import { data } from "./data";

interface ConfigHandler {
	configs: {
		[name: string]: ConfigOption<any>;
	};
	setConfig: (opt: ConfigOption<any>) => void;
	getConfig: (name: string) => ConfigOption<any>;
}

export const config: ConfigHandler = {
	configs: {},
	setConfig(opt) {
		this.configs[opt.name] = opt;
	},
	getConfig(name) {
		if (name in this.configs) {
			return this.configs[name];
		}
		throw new Error("Could not find config");
	}
};

function explicitParseInt(n: string): number {
	if (n.startsWith("0x")) {
		return parseInt(n, 16);
	}
	return parseInt(n, 10);
}

const defaults = JSON.parse(fs.readFileSync("./config/defaultOpts.json", "utf8"));
// add default config options
config.setConfig(new ConfigOption<string>("prefix", defaults.prefix, val => val.toString().trim()));
config.setConfig(
	new ConfigOption<string>("defaultLang", defaults.language, undefined, val => data.langs.includes(val))
);
config.setConfig(
	new ConfigOption<number>("embedColor", defaults.embedColor, explicitParseInt, val => val.toString(16).length === 6)
);
config.setConfig(
	new ConfigOption<[string, string]>(
		"fullBrackets",
		defaults.fullBrackets,
		(val: string) => {
			const s = val.split("");
			return [s[0], s[1]];
		},
		(val, m) => {
			if (val.length < 2 || !val[1]) {
				return false;
			}
			const mobBrackets = config.getConfig("mobBrackets").getValue(m);

			return (
				val[0].length === 1 &&
				val[1].length === 1 &&
				mobBrackets.indexOf(val[0]) === -1 &&
				mobBrackets.indexOf(val[1]) === -1
			);
		}
	)
);

config.setConfig(
	new ConfigOption<[string, string]>(
		"mobBrackets",
		defaults.mobBrackets,
		(val: string) => {
			const s = val.split("");
			return [s[0], s[1]];
		},
		(val, m) => {
			if (val.length < 2 || !val[1]) {
				return false;
			}
			const fullBrackets = config.getConfig("fullBrackets").getValue(m);
			const noImgMobBrackets = config.getConfig("noImgMobBrackets").getValue(m);
			return (
				val[0].length === 1 &&
				val[1].length === 1 &&
				fullBrackets.indexOf(val[0]) === -1 &&
				fullBrackets.indexOf(val[1]) === -1 &&
				noImgMobBrackets.indexOf(val[0]) === -1 &&
				noImgMobBrackets.indexOf(val[1]) === -1
			);
		}
	)
);

config.setConfig(
	new ConfigOption<number>(
		"triviaHint",
		defaults.triviaHint,
		val => {
			const num = explicitParseInt(val);
			// if probably ms, convert to s
			if (num > 1000) {
				return Math.floor(num / 1000);
			}
			return num;
		},
		(val, m) => {
			const triviaLimit = config.getConfig("triviaLimit").getValue(m);
			return val < triviaLimit && val > 0;
		}
	)
);

config.setConfig(
	new ConfigOption<number>(
		"triviaLimit",
		defaults.triviaLimit,
		val => {
			const num = explicitParseInt(val);
			// if probably ms, convert to s
			if (num > 1000) {
				return Math.floor(num / 1000);
			}
			return num;
		},
		(val, m) => {
			const triviaHint = config.getConfig("triviaHint").getValue(m);
			return val > triviaHint;
		}
	)
);

config.setConfig(new ConfigOption<number>("triviaMax", defaults.triviaMax, explicitParseInt));

// boolean configs need to be false by default or else they convert wrong. wEaK tYpInG iS fInE
config.setConfig(new ConfigOption("mobileView", false, Boolean));
config.setConfig(new ConfigOption("suppressEmotes", false, Boolean));
config.setConfig(new ConfigOption("allowAnime", false, Boolean));
config.setConfig(new ConfigOption("allowCustom", false, Boolean));

export const colors = JSON.parse(fs.readFileSync("./config/colors.json", "utf8"));
export const emotes = JSON.parse(fs.readFileSync("./config/emotes.json", "utf8"));
