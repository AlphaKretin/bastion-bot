"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const ygopro_data_1 = require("ygopro-data");
const Command_1 = require("../modules/Command");
const configs_1 = require("../modules/configs");
const data_1 = require("../modules/data");
const util_1 = require("../modules/util");
const valSum = (obj) => {
    const counts = Object.values(obj);
    if (counts.length === 0) {
        return 0;
    }
    return counts.reduce((acc, val) => acc + val);
};
const names = ["deck", "parse"];
const func = async (msg, mobile) => {
    if (msg.attachments.length < 1 || !msg.attachments[0].filename.endsWith(".ydk")) {
        await msg.channel.createMessage("Sorry, you need to upload a deck file to use this command!");
        return;
    }
    let lang = configs_1.config.getConfig("defaultLang").getValue(msg);
    const content = util_1.trimMsg(msg);
    for (const term of content.split(/ +/)) {
        if (data_1.data.langs.includes(term.toLowerCase())) {
            lang = term.toLowerCase();
        }
    }
    const file = msg.attachments[0];
    const deck = await (await node_fetch_1.default(file.url)).text();
    const deckRecord = {
        extra: {},
        monster: {},
        side: {},
        spell: {},
        trap: {}
    };
    let currentSection = "";
    for (const line of deck.split(/\r|\n|\r\n/)) {
        if (line.startsWith("#") || line.startsWith("!")) {
            currentSection = line.slice(1);
            continue;
        }
        if (line.trim().length > 0) {
            const card = await data_1.data.getCard(line, lang);
            if (card) {
                let name = card.id.toString();
                if (card.text[lang]) {
                    name = card.text[lang].name;
                }
                if (currentSection === "side") {
                    if (name in deckRecord.side) {
                        deckRecord.side[name]++;
                    }
                    else {
                        deckRecord.side[name] = 1;
                    }
                }
                else if (currentSection === "extra") {
                    if (name in deckRecord.extra) {
                        deckRecord.extra[name]++;
                    }
                    else {
                        deckRecord.extra[name] = 1;
                    }
                }
                else if (currentSection === "main") {
                    if (card.data.isType(ygopro_data_1.enums.type.TYPE_MONSTER)) {
                        if (name in deckRecord.monster) {
                            deckRecord.monster[name]++;
                        }
                        else {
                            deckRecord.monster[name] = 1;
                        }
                    }
                    else if (card.data.isType(ygopro_data_1.enums.type.TYPE_SPELL)) {
                        if (name in deckRecord.spell) {
                            deckRecord.spell[name]++;
                        }
                        else {
                            deckRecord.spell[name] = 1;
                        }
                    }
                    else if (card.data.isType(ygopro_data_1.enums.type.TYPE_TRAP)) {
                        if (name in deckRecord.trap) {
                            deckRecord.trap[name]++;
                        }
                        else {
                            deckRecord.trap[name] = 1;
                        }
                    }
                }
            }
        }
    }
    const title = "Contents of `" + file.filename + "`:\n";
    const monsterCount = valSum(deckRecord.monster);
    const spellCount = valSum(deckRecord.spell);
    const trapCount = valSum(deckRecord.trap);
    const mainCount = monsterCount + spellCount + trapCount;
    let mainHeader = "Main Deck (" + mainCount + " cards - ";
    const headerParts = [];
    if (monsterCount > 0) {
        headerParts.push(monsterCount + " Monsters");
    }
    if (spellCount > 0) {
        headerParts.push(spellCount + " Spells");
    }
    if (trapCount > 0) {
        headerParts.push(trapCount + " Traps");
    }
    mainHeader += headerParts.join(", ") + ")";
    let mainBody = "";
    for (const name in deckRecord.monster) {
        mainBody += deckRecord.monster[name] + " " + name + "\n";
    }
    for (const name in deckRecord.spell) {
        mainBody += deckRecord.spell[name] + " " + name + "\n";
    }
    for (const name in deckRecord.trap) {
        mainBody += deckRecord.trap[name] + " " + name + "\n";
    }
    const extraCount = valSum(deckRecord.extra);
    const extraHeader = "Extra Deck (" + extraCount + " cards)";
    let extraBody = "";
    for (const name in deckRecord.extra) {
        extraBody += deckRecord.extra[name] + " " + name + "\n";
    }
    const sideCount = valSum(deckRecord.side);
    const sideHeader = "Side Deck (" + sideCount + " cards)";
    let sideBody = "";
    for (const name in deckRecord.side) {
        sideBody += deckRecord.side[name] + " " + name + "\n";
    }
    const chan = await msg.author.getDMChannel();
    let m;
    if (mobile) {
        let out = title;
        if (mainCount > 0) {
            out += "__" + mainHeader + "__:\n" + mainBody;
        }
        if (extraCount > 0) {
            out += "__" + extraHeader + "__:\n" + extraBody;
        }
        if (sideCount > 0) {
            out += "__" + sideHeader + "__:\n" + sideBody;
        }
        const outStrings = [];
        const MESSAGE_CAP = 2000;
        while (out.length > MESSAGE_CAP) {
            let index = out.slice(0, MESSAGE_CAP).lastIndexOf("\n");
            if (index === -1 || index >= MESSAGE_CAP) {
                index = out.slice(0, MESSAGE_CAP).lastIndexOf(".");
                if (index === -1 || index >= MESSAGE_CAP) {
                    index = out.slice(0, MESSAGE_CAP).lastIndexOf(" ");
                    if (index === -1 || index >= MESSAGE_CAP) {
                        index = MESSAGE_CAP - 1;
                    }
                }
            }
            outStrings.push(out.slice(0, index + 1));
            out = out.slice(index + 1);
        }
        outStrings.push(out);
        for (const outString of outStrings) {
            m = await chan.createMessage(outString);
        }
    }
    else {
        const out = {
            embed: { title, fields: [], color: configs_1.config.getConfig("embedColor").getValue(msg) }
        };
        // come on typescript, really? it's declared right there
        if (out.embed && out.embed.fields) {
            if (mainCount > 0) {
                out.embed.fields.push({ name: mainHeader, value: mainBody });
            }
            if (extraCount > 0) {
                out.embed.fields.push({ name: extraHeader, value: extraBody });
            }
            if (sideCount > 0) {
                out.embed.fields.push({ name: sideHeader, value: sideBody });
            }
        }
        m = await chan.createMessage(out);
    }
    await msg.addReaction("📬");
    return m;
};
const desc = "Parses and lists the contents of a YGOPro `.ydk` deck file.";
exports.cmd = new Command_1.Command(names, func, undefined, desc, "<upload a `.ydk` file in the same message>");
//# sourceMappingURL=deck.js.map