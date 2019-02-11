"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("mz/fs"));
const spreadsheet_to_json_1 = require("spreadsheet-to-json");
const extract = (spreadsheetKey) => new Promise((resolve, reject) => {
    spreadsheet_to_json_1.extractSheets({ spreadsheetKey, sheetsToExtract: ["Functions", "Constants", "Parameters"] }, (err, data) => {
        if (err) {
            return reject(err);
        }
        resolve(data);
    });
});
exports.libraryPages = {};
class Library {
    constructor(spreadsheetId) {
        this.source = spreadsheetId;
        this.update();
    }
    async getResults(query) {
        const out = [];
        if (!this.lib) {
            throw new Error("Scripting library not yet loaded! Please wait.");
        }
        const library = await this.lib;
        const term = query.toLowerCase();
        for (const libEntry of library) {
            if (libEntry.name
                .toLowerCase()
                .split("(")[0]
                .includes(term)) {
                out.push(libEntry);
            }
        }
        return out;
    }
    update() {
        return (this.lib = this.load());
    }
    async load() {
        const data = await extract(this.source);
        const sheet = Object.values(data).find(s => s.length > 0);
        const out = [];
        if (!sheet) {
            throw new Error("Sheet does not conform to Functions, Constants or Params!");
        }
        for (const row of sheet) {
            let variant;
            if ("sig" in row) {
                variant = row.sig;
            }
            else if ("val" in row) {
                variant = row.val;
            }
            else if ("type" in row) {
                variant = row.type;
            }
            else {
                throw new Error("Sheet does not conform to Functions, Constants or Params!");
            }
            out.push({ variant, name: row.name, desc: row.desc });
        }
        return out;
    }
}
const sheetOpts = JSON.parse(fs.readFileSync("config/sheetOpts.json", "utf8"));
exports.functions = new Library(sheetOpts.functions);
exports.constants = new Library(sheetOpts.constants);
exports.params = new Library(sheetOpts.params);
//# sourceMappingURL=libraryPages.js.map