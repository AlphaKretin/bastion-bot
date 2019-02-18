import * as Eris from "eris";
import { Command } from "../modules/Command";
import { trivia } from "../modules/trivia";

const names = ["trivia"];
const func = async (msg: Eris.Message) => {
    await trivia(msg);
};

export const cmd = new Command(names, func);
