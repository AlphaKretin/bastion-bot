import * as Eris from "eris";
import { owners } from "../config/auth.json";

type descFunc = (prefix: string) => string;

export class Command {
	public names: string[];
	public readonly onEdit: boolean;
	public desc?: string | descFunc;
	public usage?: string;
	private func: (msg: Eris.Message, mobile: boolean) => Promise<void | Eris.Message>;
	private condition?: (msg: Eris.Message) => boolean;
	private mod: boolean;
	private owner: boolean;
	constructor(
		names: string[],
		func: (msg: Eris.Message, mobile: boolean) => Promise<void | Eris.Message>,
		condition?: (msg: Eris.Message) => boolean,
		desc?: string | descFunc,
		usage?: string,
		mod = false,
		owner = false,
		onEdit = false
	) {
		if (names.length === 0) {
			throw new Error("No names defined!");
		}
		this.names = names;
		this.func = func;
		if (condition) {
			this.condition = condition;
		}
		this.mod = mod;
		this.owner = owner;
		this.onEdit = onEdit;
		this.desc = desc;
		this.usage = usage;
	}

	public async execute(msg: Eris.Message, mobile = false): Promise<void | Eris.Message> {
		if (this.isCanExecute(msg)) {
			return await this.func(msg, mobile);
		}
	}

	public isCanExecute(msg: Eris.Message): boolean {
		if (this.mod) {
			const member = msg.member;
			if (!(member && member.permission.has("manageMessages"))) {
				return false;
			}
		} 
		if (this.owner && !owners.includes(msg.author.id)) {
			return false;
		}
		return this.condition ? this.condition(msg) : true;
	}

}
