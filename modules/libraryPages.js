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
const bot_1 = require("./bot");
const errors_1 = require("./errors");
const Page_1 = require("./Page");
const util_1 = require("./util");
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
async function sendLibrary(list, msg) {
    exports.libraryPages[msg.channel.id] = new Page_1.Page(msg.author.id, list);
    const m = await msg.channel.createMessage(generateLibraryList(msg.channel.id));
    exports.libraryPages[msg.channel.id].msg = m;
    if (util_1.canReact(m)) {
        await addLibraryButtons(m);
    }
    else {
        await msg.channel.createMessage(errors_1.Errors.ERROR_REACT_FAILURE);
    }
    return m;
}
exports.sendLibrary = sendLibrary;
function generateLibraryList(channelID) {
    const page = exports.libraryPages[channelID];
    const out = [];
    const entries = page.getSpan();
    let i = 1;
    const maxLength = Math.max(...entries.map(e => e.variant.length));
    const digitLength = (page.index + 10).toString().length;
    for (const entry of entries) {
        out.push("[" +
            (i + page.index).toString().padStart(digitLength, "0") +
            "] " +
            " ".repeat(maxLength - entry.variant.length) +
            entry.variant +
            " | " +
            entry.name);
        i++;
    }
    return "```cs\n" + out.join("\n") + "```\n`" + "Page " + page.currentPage + "/" + page.maxPage + "`";
}
exports.generateLibraryList = generateLibraryList;
let reactionID = 0;
function incrementReactionID() {
    const next = (reactionID + 1) % 100;
    reactionID = next;
}
async function addLibraryButtons(msg) {
    const initialID = reactionID;
    const page = exports.libraryPages[msg.channel.id];
    if (page.canBack() && reactionID === initialID) {
        await bot_1.addReactionButton(msg, "⬅", async (mes) => {
            incrementReactionID();
            page.back(10);
            const out = generateLibraryList(msg.channel.id);
            await mes.edit(out);
            await mes.removeReactions();
            await addLibraryButtons(msg);
        });
    }
    if (page.canForward(10) && reactionID === initialID) {
        await bot_1.addReactionButton(msg, "➡", async (mes) => {
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
        await bot_1.addReactionButton(msg, util_1.numToEmoji(ind + 1), async () => {
            await addLibraryDescription(page, ind, msg.channel.id);
        });
    }
}
exports.addLibraryButtons = addLibraryButtons;
async function addLibraryDescription(page, index, channelID) {
    const entries = page.getSpan();
    if (!(index in entries && page.msg)) {
        return;
    }
    const desc = entries[index].desc || "Sorry, I don't have a description for this!";
    await page.msg.edit(generateLibraryList(channelID) + "\n`" + desc + "`");
}
exports.addLibraryDescription = addLibraryDescription;
//# sourceMappingURL=libraryPages.js.map