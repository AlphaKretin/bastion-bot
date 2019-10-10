import * as Eris from "eris";
import * as fs from "mz/fs";
import { extractSheets, SheetResults } from "spreadsheet-to-json";
import { addReactionButton } from "./bot";
import { Errors } from "./errors";
import { Page } from "./Page";
import { canReact, numToEmoji } from "./util";

const extract = (spreadsheetKey: string): Promise<SheetResults> =>
    new Promise((resolve, reject) => {
        extractSheets({ spreadsheetKey, sheetsToExtract: ["Functions", "Constants", "Parameters"] }, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    });

export interface ILibraryData {
    variant: string; // type signature for functions, value for constants, type for parameters
    name: string;
    desc: string | null;
}

export type LibraryPage = Page<ILibraryData>;
export const libraryPages: { [channelID: string]: LibraryPage } = {};

class Library {
    private lib?: Promise<ILibraryData[]>;
    private source: string;

    constructor(spreadsheetId: string) {
        this.source = spreadsheetId;
        this.update();
    }

    public async getResults(query: string): Promise<ILibraryData[]> {
        const out: ILibraryData[] = [];
        if (!this.lib) {
            throw new Error("Scripting library not yet loaded! Please wait.");
        }
        const library = await this.lib;
        const term = query.toLowerCase();
        for (const libEntry of library) {
            if (
                libEntry.name
                    .toLowerCase()
                    .split("(")[0]
                    .includes(term)
            ) {
                out.push(libEntry);
            }
        }
        return out;
    }

    public update() {
        return (this.lib = this.load());
    }

    private async load(): Promise<ILibraryData[]> {
        const data = await extract(this.source);
        const sheet = Object.values(data).find(s => s.length > 0);
        const out: ILibraryData[] = [];
        if (!sheet) {
            throw new Error("Sheet does not conform to Functions, Constants or Params!");
        }
        for (const row of sheet) {
            let variant: string;
            if ("sig" in row) {
                variant = row.sig;
            } else if ("val" in row) {
                variant = row.val;
            } else if ("type" in row) {
                variant = row.type;
            } else {
                throw new Error("Sheet does not conform to Functions, Constants or Params!");
            }
            out.push({ variant, name: row.name, desc: row.desc });
        }
        return out;
    }
}

const sheetOpts = JSON.parse(fs.readFileSync("config/sheetOpts.json", "utf8"));
export const functions = new Library(sheetOpts.functions);
export const constants = new Library(sheetOpts.constants);
export const params = new Library(sheetOpts.params);

export async function sendLibrary(list: ILibraryData[], msg: Eris.Message) {
    libraryPages[msg.channel.id] = new Page<ILibraryData>(msg.author.id, list);
    const m = await msg.channel.createMessage(generateLibraryList(msg.channel.id));
    libraryPages[msg.channel.id].msg = m;
    if (canReact(m)) {
        await addLibraryButtons(m);
    }
    return m;
}

export function generateLibraryList(channelID: string): string {
    const page = libraryPages[channelID];
    const out: string[] = [];
    const entries = page.getSpan();
    let i = 1;
    const maxLength = Math.max(...entries.map(e => e.variant.length));
    const digitLength = (page.index + 10).toString().length;
    for (const entry of entries) {
        out.push(
            "[" +
                (i + page.index).toString().padStart(digitLength, "0") +
                "] " +
                " ".repeat(maxLength - entry.variant.length) +
                entry.variant +
                " | " +
                entry.name
        );
        i++;
    }
    return "```cs\n" + out.join("\n") + "```\n`" + "Page " + page.currentPage + "/" + page.maxPage + "`";
}

let reactionID = 0;

function incrementReactionID() {
    const next = (reactionID + 1) % 100;
    reactionID = next;
}

export async function addLibraryButtons(msg: Eris.Message) {
    const initialID = reactionID;
    const page = libraryPages[msg.channel.id];
    if (page.canBack() && reactionID === initialID) {
        await addReactionButton(msg, "⬅", async mes => {
            incrementReactionID();
            page.back(10);
            const out = generateLibraryList(msg.channel.id);
            await mes.edit(out);
            await mes.removeReactions();
            await addLibraryButtons(msg);
        });
    }
    if (page.canForward(10) && reactionID === initialID) {
        await addReactionButton(msg, "➡", async mes => {
            incrementReactionID();
            page.forward(10);
            const out = generateLibraryList(msg.channel.id);
            await mes.edit(out);
            await mes.removeReactions();
            await addLibraryButtons(msg);
        });
    }
    const entries = page.getSpan();
    for (let ind = 0; ind < Math.min(entries.length, 10); ind++) {
        if (reactionID !== initialID) {
            break;
        }
        await addReactionButton(msg, numToEmoji(ind + 1)!, async () => {
            await addLibraryDescription(page, ind, msg.channel.id);
        });
    }
}

export async function addLibraryDescription(page: Page<ILibraryData>, index: number, channelID: string) {
    const entries = page.getSpan();
    if (!(index in entries && page.msg)) {
        return;
    }
    const desc = entries[index].desc || "Sorry, I don't have a description for this!";
    await page.msg.edit(generateLibraryList(channelID) + "\n`" + desc + "`");
}
