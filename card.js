module.exports = function (setcodes) {
    let Card = class Card {
        constructor(datas) {
            this._code = datas[0];
            this._ot = datas[1];
            this._alias = datas[2];
            this._setcode = datas[3];
            this._type = datas[4];
            this._atk = datas[5];
            this._def = datas[6];
            this._level = datas[7];
            this._race = datas[8];
            this._attribute = datas[9];
            this._category = datas[10];
            this._name = datas[12];
            this._desc = datas[13];
            this._strings = {}; //is an object instead of an array so we can get a value's real index if one before it is skipped
            let re = /\S/;
            if (re.test(datas[14]))
                this._strings[1] = datas[14];
            if (re.test(datas[15]))
                this._strings[2] = datas[15];
            if (re.test(datas[16]))
                this._strings[3] = datas[16];
            if (re.test(datas[17]))
                this._strings[4] = datas[17];
            if (re.test(datas[18]))
                this._strings[5] = datas[18];
            if (re.test(datas[19]))
                this._strings[6] = datas[19];
            if (re.test(datas[20]))
                this._strings[7] = datas[20];
            if (re.test(datas[21]))
                this._strings[8] = datas[21];
            if (re.test(datas[22]))
                this._strings[9] = datas[22];
            if (re.test(datas[23]))
                this._strings[10] = datas[23];
            if (re.test(datas[24]))
                this._strings[11] = datas[24];
            if (re.test(datas[25]))
                this._strings[12] = datas[25];
            if (re.test(datas[26]))
                this._strings[13] = datas[26];
            if (re.test(datas[27]))
                this._strings[14] = datas[27];
            if (re.test(datas[28]))
                this._strings[15] = datas[28];
            if (re.test(datas[29]))
                this._strings[16] = datas[29];
        }

        //Getters
        get code() {
            return this._code;
        }

        get ot() {
            return this.convertOT();
        }

        get alias() {
            return this._alias;
        }

        get sets() {
            return this.convertSetcode();
        }

        get types() {
            return this.convertType([0x10, 0x20], [0x100]);
        }

        get allTypes() {
            return this.convertType([], []);
        }

        get atk() {
            return this.convertStat(this._atk);
        }

        get def() {
            if (this.types.indexOf("Link") === -1) {
                return this.convertStat(this._def);
            } else {
                return null;
            }
        }

        get markers() {
            if (this.types.indexOf("Link") > -1) {
                return this.convertMarkers();
            } else {
                return null;
            }
        }

        get level() {
            return this.getLevelScales()[0];
        }

        get lscale() {
            return this.getLevelScales()[1];
        }

        get rscale() {
            return this.getLevelScales()[2];
        }

        get race() {
            return this.convertRace();
        }

        get attribute() {
            return this.convertAtt();
        }

        //category has no current use in Bastion

        get name() {
            return this._name;
        }

        get desc() {
            return this.getCardText(); //if pendulum, [ptext, mtext, p heading, m heading], otherwise [text]
        }

        get strings() {
            return this._strings;
        }

        //Methods
        convertOT() {
            for (let key of Object.keys(Card.ots)) {
                if (this._ot === Card.ots[key]) {
                    return key;
                }
            }
            return "Null OT";
        }

        convertSetcode() {
            let code = this._setcode.toString("16").padStart(16, "0");
            if (code === "0") {
                return null;
            }
            let sets = [];
            let codes = ["0x" + code.slice(0, 4).replace(/^[0]+/g, ""), "0x" + code.slice(4, 8).replace(/^[0]+/g, ""), "0x" + code.slice(8, 12).replace(/^[0]+/g, ""), "0x" + code.slice(12, 16).replace(/^[0]+/g, "")]; //setcodes are 4 concatenated hex values, we could use bitshifting to get them except JS doesn't support bitwise ops on numbers over 32 bit

            for (let co of codes) {
                if (co in setcodes) {
                    sets.push(setcodes[co]);
                }
            }

            if (sets.length === 0) {
                return null;
            } else {
                return sets;
            }
        }

        convertType(delay, ignore) { //types in delay are put at the end
            let typs = [];
            let t = [];
            for (let key of Object.keys(Card.typeObj)) {
                if ((this._type & Card.typeObj[key]) && delay.indexOf(Card.typeObj[key]) === -1 && ignore.indexOf(Card.typeObj[key]) === -1) {
                    typs.push(key)
                }
                t.push(Card.typeObj[key]);
            }
            for (let key of delay) {
                if (t.indexOf(key) > -1 && (this._type & Card.typeObj[key]) && ignore.indexOf(Card.typeObj[key]) === -1) {
                    typs.push(key)
                }
            }
            return typs;
        }

        isType(tpe) {
            if ((this._type & tpe) === tpe) { //this will usually be enough...
                return true
            }
            if (this._type >= 0x100000000 || tpe >= 0x100000000) { //...except Javascript can't do bitwise operations on Numbers greater than 32-bit
                let tempType1 = Math.floor(this._type / 0x100000000);
                let tempType2 = this._type - tempType1 * 0x100000000;
                let ttpe1 = Math.floor(tpe / 0x100000000);
                let ttpe2 = tpe - ttpe1 * 0x100000000;
                return (tempType1 & ttpe1) === ttpe1 && (tempType2 & ttpe2) === ttpe2
            }
            return false
        }

        convertStat(stat) {
            return stat === -2 && "?" || stat.toString();
        }

        convertMarkers() {
            let out = "";
            if (this._def & 0x001) {
                out += "↙️";
            }
            if (this._def & 0x002) {
                out += "⬇️";
            }
            if (this._def & 0x004) {
                out += "↘️";
            }
            if (this._def & 0x008) {
                out += "⬅️";
            }
            if (this._def & 0x020) {
                out += "➡️";
            }
            if (this._def & 0x040) {
                out += "↖️";
            }
            if (this._def & 0x080) {
                out += "⬆️";
            }
            if (this._def & 0x100) {
                out += "↗️";
            }
            return out;
        }

        getLevelScales() {
            return [this._level & 0xff, (this._level & 0xf000000) >> 24, (this._level & 0xf0000) >> 16]; //P scales are bitmasked into the level field, check MLD's database tutorial
        }

        convertRace() {
            let racs = [];
            for (let key of Object.keys(Card.races)) {
                if (this._race & Card.races[key] || Math.floor(this._race / 0x100000000) & Math.floor(Card.races[key] / 0x100000000)) { //over 32-bit JS suddenly can't handle bitwise operations, so edo9300 worked some magic
                    racs.push(key);
                }
            }
            if (racs.length === 0) {
                return ["???"];
            } else {
                return racs;
            }
        }

        convertAtt() {
            let atts = [];
            for (let key of Object.keys(Card.attributes)) {
                if (this._attribute & Card.attributes[key]) {
                    atts.push(key);
                }
            }
            if (atts.length === 0) {
                return ["???"];
            } else {
                return atts;
            }
        }

        getCardText() {
            let lines = this._desc.split("\r\n");
            if (lines.length > 1) {
                let ind;
                lines.forEach(function (key, index) {
                    if (lines[index].indexOf("---") > -1) { //pendulum cards have two "sections" split by a row of "-"
                        ind = index;
                    }
                });
                if (ind) {
                    let head1 = lines.slice(0, 1)[0];
                    let head2 = lines.slice(ind + 1, ind + 2)[0];
                    head1 = head1.slice(2, head1.length - 2);
                    head2 = head2.slice(2, head2.length - 2);
                    return [lines.slice(1, ind).join("\n"), lines.slice(ind + 2).join("\n"), head1, head2]; //a few lines are skipped because each section has headings
                }
            }
            return [this._desc];
        }
    }
    //Data - has to be defined outside the class because JS is weird, but hey it works
    Card.ots = {
        "OCG": 0x1,
        "TCG": 0x2,
        "TCG/OCG": 0x3,
        "Anime": 0x4,
        "Illegal": 0x8,
        "Video Game": 0x10,
        "Custom": 0x20,
    };


    Card.otList = [];
    Object.keys(Card.ots).forEach(function (key, index) {
        Card.otList.push(key.toLowerCase());
    });

    Card.typeObj = {
        "Monster": 0x1,
        "Spell": 0x2,
        "Trap": 0x4,
        "Normal": 0x10,
        "Effect": 0x20,
        "Fusion": 0x40,
        "Ritual": 0x80,
        "Trap Monster": 0x100,
        "Spirit": 0x200,
        "Union": 0x400,
        "Gemini": 0x800,
        "Tuner": 0x1000,
        "Synchro": 0x2000,
        "Token": 0x4000,
        "Quick-Play": 0x10000,
        "Continuous": 0x20000,
        "Equip": 0x40000,
        "Field": 0x80000,
        "Counter": 0x100000,
        "Flip": 0x200000,
        "Toon": 0x400000,
        "Xyz": 0x800000,
        "Pendulum": 0x1000000,
        "Special Summon": 0x2000000,
        "Link": 0x4000000,
        "Armor": 0x10000000,
        "Plus": 0x20000000,
        "Minus": 0x40000000,
    };


    Card.typeList = [];
    Object.keys(Card.typeObj).forEach(function (key, index) {
        Card.typeList.push(key.toLowerCase());
    });

    Card.races = {
        "Warrior": 0x1,
        "Spellcaster": 0x2,
        "Fairy": 0x4,
        "Fiend": 0x8,
        "Zombie": 0x10,
        "Machine": 0x20,
        "Aqua": 0x40,
        "Pyro": 0x80,
        "Rock": 0x100,
        "Winged Beast": 0x200,
        "Plant": 0x400,
        "Insect": 0x800,
        "Thunder": 0x1000,
        "Dragon": 0x2000,
        "Beast": 0x4000,
        "Beast-Warrior": 0x8000,
        "Dinosaur": 0x10000,
        "Fish": 0x20000,
        "Sea Serpent": 0x40000,
        "Reptile": 0x80000,
        "Psychic": 0x100000,
        "Divine-Beast": 0x200000,
        "Creator God": 0x400000,
        "Wyrm": 0x800000,
        "Cyberse": 0x1000000,
        "Yokai": 0x80000000,
        "Charisma": 0x100000000,
    };


    Card.raceList = [];
    Object.keys(Card.races).forEach(function (key, index) {
        Card.raceList.push(key.toLowerCase());
    });

	for (let race of Card.raceList) {
		for (let r of Card.raceList) {
			if (r !== race && race.startsWith(r)) {
				Card.raceConflicts[r] = race;
			}
		}
	}

    Card.attributes = {
        "EARTH": 0x1,
        "WATER": 0x2,
        "FIRE": 0x4,
        "WIND": 0x8,
        "LIGHT": 0x10,
        "DARK": 0x20,
        "DIVINE": 0x40,
        "LAUGH": 0x80,
    };

    Card.attributeList = [];
    Object.keys(Card.attributes).forEach(function (key, index) {
        Card.attributeList.push(key.toLowerCase());
    });
    
    Card.setList = [];
    Object.keys(setcodes).forEach(function(key, index) {
    	Card.setList.push(setcodes[key].toLowerCase());
    });

    return Card;
}