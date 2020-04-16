import { Message, MessageContent } from "eris";

export type ReactionFunc = (msg: Message, userID: string) => Promise<void | MessageContent>;

export class ReactionButton {
	public name: string;
	private func: ReactionFunc;
	private hostMsg: Message;
	constructor(msg: Message, emoji: string, fun: ReactionFunc) {
		this.hostMsg = msg;
		this.func = fun;
		this.name = emoji;
	}
	public async execute(userID: string): Promise<void> {
		const result = await this.func(this.hostMsg, userID);
		if (result !== undefined) {
			await this.hostMsg.edit(result);
		}
	}

	get id(): string {
		return this.hostMsg.id;
	}
}
