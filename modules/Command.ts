import { Message } from "eris";
import { owners } from "../config/auth.json";
import { stats } from "./stats.js";

type descFunc = (prefix: string) => string;

export class Command {
	public names: string[];
	public readonly onEdit: boolean;
	public desc?: string | descFunc;
	public usage?: string;
	private func: (msg: Message, mobile: boolean) => Promise<void | Message>;
	private condition?: (msg: Message) => boolean;
	private mod: boolean;
	private owner: boolean;
	constructor(
		names: string[],
		func: (msg: Message, mobile: boolean) => Promise<void | Message>,
		condition?: (msg: Message) => boolean,
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

	public async execute(msg: Message, mobile = false, edit = false): Promise<void | Message> {
		if (this.isCanExecute(msg)) {
			const result = await this.func(msg, mobile);
			if (!edit) {
				await stats.writeCommand(msg, this.names[0]);
			}
			return result;
		}
	}

	public isCanExecute(msg: Message): boolean {
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
