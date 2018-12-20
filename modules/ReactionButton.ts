import * as Eris from "eris";

export type ReactionFunc = (msg: Eris.Message, userID: string) => Promise<void | Eris.MessageContent>;

export class ReactionButton {
    public name: string;
    private func: ReactionFunc;
    private hostMsg: Eris.Message;
    constructor(msg: Eris.Message, emoji: string, fun: ReactionFunc) {
        this.hostMsg = msg;
        this.func = fun;
        this.name = emoji;
    }
    public async execute(userID: string): Promise<void> {
        const result = await this.func(this.hostMsg, userID);
        if (result !== undefined) {
            this.hostMsg.edit(result);
        }
    }

    get id() {
        return this.hostMsg.id;
    }
}
