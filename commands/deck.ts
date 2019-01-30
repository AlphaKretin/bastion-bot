import * as Eris from "eris";
import request from "request-promise-native";
import { enums } from "ygopro-data";
import { Command } from "../modules/Command";
import { config } from "../modules/configs";
import { data } from "../modules/data";
import { trimMsg } from "../modules/util";

interface IDeckSection {
    [name: string]: number;
}

interface IDeckRecord {
    monster: IDeckSection;
    spell: IDeckSection;
    trap: IDeckSection;
    extra: IDeckSection;
    side: IDeckSection;
}

const valSum = (obj: IDeckSection): number => {
    const counts = Object.values(obj);
    if (counts.length === 0) {
        return 0;
    }
    return counts.reduce((acc, val) => acc + val);
};

const names = ["deck", "parse"];
const func = async (msg: Eris.Message, mobile: boolean) => {
    if (msg.attachments.length < 1 || !msg.attachments[0].filename.endsWith(".ydk")) {
        await msg.channel.createMessage("Sorry, you need to upload a deck file to use this command!");
        return;
    }
    let lang: string = config.getConfig("defaultLang").getValue(msg);
    const content = trimMsg(msg);
    for (const term of content.split(/ +/)) {
        if (data.langs.indexOf(term.toLowerCase()) > -1) {
            lang = term.toLowerCase();
        }
    }
    const file = msg.attachments[0];
    const deck = await request(file.url);
    const deckRecord: IDeckRecord = {
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
        const card = await data.getCard(line, lang);
        if (card) {
            let name = card.id.toString();
            if (card.text[lang]) {
                name = card.text[lang].name;
            }
            if (currentSection === "side") {
                if (name in deckRecord.side) {
                    deckRecord.side[name]++;
                } else {
                    deckRecord.side[name] = 1;
                }
            } else if (currentSection === "extra") {
                if (name in deckRecord.extra) {
                    deckRecord.extra[name]++;
                } else {
                    deckRecord.extra[name] = 1;
                }
            } else if (currentSection === "main") {
                if (card.data.isType(enums.type.TYPE_MONSTER)) {
                    if (name in deckRecord.monster) {
                        deckRecord.monster[name]++;
                    } else {
                        deckRecord.monster[name] = 1;
                    }
                } else if (card.data.isType(enums.type.TYPE_SPELL)) {
                    if (name in deckRecord.spell) {
                        deckRecord.spell[name]++;
                    } else {
                        deckRecord.spell[name] = 1;
                    }
                } else if (card.data.isType(enums.type.TYPE_TRAP)) {
                    if (name in deckRecord.trap) {
                        deckRecord.trap[name]++;
                    } else {
                        deckRecord.trap[name] = 1;
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
    const headerParts: string[] = [];
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
        if (deckRecord.monster.hasOwnProperty(name)) {
            mainBody += deckRecord.monster[name] + " " + name + "\n";
        }
    }
    for (const name in deckRecord.spell) {
        if (deckRecord.spell.hasOwnProperty(name)) {
            mainBody += deckRecord.spell[name] + " " + name + "\n";
        }
    }
    for (const name in deckRecord.trap) {
        if (deckRecord.trap.hasOwnProperty(name)) {
            mainBody += deckRecord.trap[name] + " " + name + "\n";
        }
    }
    const extraCount = valSum(deckRecord.extra);
    const extraHeader = "Extra Deck (" + extraCount + " cards)";
    let extraBody = "";
    for (const name in deckRecord.extra) {
        if (deckRecord.extra.hasOwnProperty(name)) {
            extraBody += deckRecord.extra[name] + " " + name + "\n";
        }
    }
    const sideCount = valSum(deckRecord.side);
    const sideHeader = "Side Deck (" + sideCount + " cards)";
    let sideBody = "";
    for (const name in deckRecord.side) {
        if (deckRecord.side.hasOwnProperty(name)) {
            sideBody += deckRecord.side[name] + " " + name + "\n";
        }
    }
    const chan = await msg.author.getDMChannel();
    let m: Eris.Message | undefined;
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
        const outStrings: string[] = [];
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
    } else {
        const out: Eris.MessageContent = {
            embed: { title, fields: [], color: config.getConfig("embedColor").getValue(msg) }
        };
        if (mainCount > 0) {
            out.embed!.fields!.push({ name: mainHeader, value: mainBody });
        }
        if (extraCount > 0) {
            out.embed!.fields!.push({ name: extraHeader, value: extraBody });
        }
        if (sideCount > 0) {
            out.embed!.fields!.push({ name: sideHeader, value: sideBody });
        }
        m = await chan.createMessage(out);
    }
    await msg.addReaction("📬");
    return m;
};

export const cmd = new Command(names, func);
