import * as Eris from "eris";

export function trimMsg(msg: Eris.Message | string): string {
    const m = msg instanceof Eris.Message ? msg.content : msg;
    return m
        .trim()
        .split(/ +/)
        .slice(1)
        .join(" ");
}
