import * as fs from "mz/fs";
import { extractSheets, SheetResults } from "spreadsheet-to-json";
import { Page } from "./matchPages";

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
    desc: string;
}

export type LibraryPage = Page<ILibraryData>;
export const libraryPages: { [serverID: string]: LibraryPage } = {};

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
