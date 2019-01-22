import * as Eris from "eris";
import request = require("request");
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

const names = ["deck", "parse"];
const func = async (msg: Eris.Message): Promise<void> => {
    if (msg.attachments.length < 1) {
        await msg.channel.createMessage("Sorry, you need to upload a deck file to use this command!");
    }
    let lang: string = config.getConfig("defaultLang").getValue(msg);
    const content = trimMsg(msg);
    for (const term of content.split(/ +/)) {
        if (data.langs.indexOf(term.toLowerCase()) > -1) {
            lang = term.toLowerCase();
        }
    }
    const file = msg.attachments[0];
    const req = await request(file.url);
    const deck = req.body as string;
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
    let out = "Contents of `" + file.filename + "`:\n";
    const monsterCount = Object.keys(deckRecord.monster).length;
    if (monsterCount > 0) {
        out += "__" + monsterCount + " Monsters__:\n";
        for (const name in deckRecord.monster) {
            if (deckRecord.monster.hasOwnProperty(name)) {
                out += deckRecord.monster[name] + " " + name + "\n";
            }
        }
    }
    const spellCount = Object.keys(deckRecord.spell).length;
    if (spellCount > 0) {
        out += "__" + spellCount + " Spells__:\n";
        for (const name in deckRecord.spell) {
            if (deckRecord.spell.hasOwnProperty(name)) {
                out += deckRecord.spell[name] + " " + name + "\n";
            }
        }
    }
    const trapCount = Object.keys(deckRecord.trap).length;
    if (trapCount > 0) {
        out += "__" + trapCount + " Traps__:\n";
        for (const name in deckRecord.trap) {
            if (deckRecord.trap.hasOwnProperty(name)) {
                out += deckRecord.trap[name] + " " + name + "\n";
            }
        }
    }
    const extraCount = Object.keys(deckRecord.extra).length;
    if (extraCount > 0) {
        out += "__" + extraCount + " Extra Deck__:\n";
        for (const name in deckRecord.extra) {
            if (deckRecord.extra.hasOwnProperty(name)) {
                out += deckRecord.extra[name] + " " + name + "\n";
            }
        }
    }
    const sideCount = Object.keys(deckRecord.side).length;
    if (sideCount > 0) {
        out += "__" + sideCount + " Side Deck__:\n";
        for (const name in deckRecord.side) {
            if (deckRecord.side.hasOwnProperty(name)) {
                out += deckRecord.side[name] + " " + name + "\n";
            }
        }
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
    const chan = await msg.author.getDMChannel();
    for (const outString of outStrings) {
        await chan.createMessage(outString);
    }
    await msg.addReaction("📬");
};

export const cmd = new Command(names, func);
