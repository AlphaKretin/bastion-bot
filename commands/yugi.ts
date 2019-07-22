import * as Eris from "eris";
import { Command } from "../modules/Command";
import { Errors } from "../modules/errors";
import { trimMsg } from "../modules/util";
import { getYugipediaPage } from "../modules/yugipedia";

const names = ["yugi", "pedia", "wiki"];
const func = async (msg: Eris.Message) => {
    const query = trimMsg(msg);
    try {
        const url = await getYugipediaPage(query);
        return await msg.channel.createMessage(url);
    } catch (e) {
        if (e.message === Errors.ERROR_YUGI_API) {
            return await msg.channel.createMessage("Sorry, I couldn't find a page for `" + query + "`.");
        } else {
            throw e;
        }
    }
};

const desc = "Searches for a page on the Yugipedia Yu-Gi-Oh! Wiki using their own search system, and displays the URL.";

export const cmd = new Command(names, func, undefined, desc, "page");
