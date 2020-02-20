import * as Eris from "eris";
import * as util from "util";
import { Command } from "../modules/Command";
import { data } from "../modules/data";
import { trimMsg } from "../modules/util";
import { YgoData } from "ygopro-data";

// make import used so it's not optimised out
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getData(): YgoData {
	return data;
}

const names: string[] = ["eval"];

async function func(msg: Eris.Message): Promise<Eris.Message> {
	const val = trimMsg(msg);
	let evaled;
	try {
		// tslint:disable-next-line:no-eval
		evaled = await eval(val);
	} catch (e) {
		evaled = e;
	}
	const output = util.inspect(evaled, true, 5, false);
	return await msg.channel.createMessage("```json\n" + output + "```");
}

export const command = new Command(names, func, undefined, undefined, undefined, false, true);
