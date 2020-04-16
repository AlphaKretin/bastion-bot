// any allowed because it's a function to convert from any type
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Message, Guild } from "eris";
import * as fs from "mz/fs";
import { Errors } from "./errors";
import { getGuildFromMsg } from "./util";

interface ValueTable<T> {
	[guild: string]: T;
}

export class ConfigOption<T> {
	public name: string;
	private val: ValueTable<T>;
	private filePath: string;
	private conv?: (val: any) => T;
	private chk?: (val: T, m: Message | Guild) => boolean;
	constructor(name: string, defaultValue: T, conv?: (val: any) => T, chk?: (val: T, m: Message | Guild) => boolean) {
		this.name = name;
		this.filePath = "./confs/" + this.name + ".json";
		if (fs.existsSync(this.filePath)) {
			this.val = JSON.parse(fs.readFileSync(this.filePath, "utf8"), (_, val) => val as T);
		} else {
			this.val = {
				default: defaultValue
			};
		}
		this.chk = chk;
		this.conv = conv;
	}

	public setValue(g: Guild | Message, v?: any): number {
		if (g && g instanceof Message) {
			g = getGuildFromMsg(g);
		}
		if (v) {
			if (this.conv) {
				v = this.conv(v);
			} else {
				v = v as T;
			}
		}
		if (!this.chk || !v || this.chk(v, g)) {
			if (g) {
				if (!fs.existsSync("./confs")) {
					fs.mkdirSync("./confs");
				}
				if (v) {
					this.val[g.id] = v;
					fs.writeFileSync(this.filePath, JSON.stringify(this.val, null, 4));
					return 1;
				} else {
					delete this.val[g.id];
					fs.writeFileSync(this.filePath, JSON.stringify(this.val, null, 4));
					return 0;
				}
			} else {
				throw new Error("Cannot set config except for a guild!");
			}
		} else {
			throw new Error("Invalid value for config!");
		}
	}

	public getValue(g?: Guild | Message): T {
		if (g && g instanceof Message) {
			try {
				g = getGuildFromMsg(g);
			} catch (e) {
				if (e.message === Errors.ERROR_CONFIG_DM) {
					return this.val.default;
				}
			}
		}
		if (g && g.id in this.val) {
			return this.val[g.id];
		}
		return this.val.default;
	}
}
