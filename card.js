module.exports = function(setcodes) {
	return class Card {
		constructor(code, ot, alias, setcode, type, atk, def, level, race, attribute, category, name, desc, str1, str2, str3, str4, str5, str6, str7, str8, str9, str10, str11, str12, str13, str14, str15, str16) {
			this._code = code;
			this._ot = ot;
			this._alias = alias;
			this._setcode = setcode;
			this._type = type;
			this._atk = atk;
			this._def = def;
			this._level = level;
			this._race = race;
			this._attribute = attribute;
			this._category = category;
			this._name = name;
			this._desc = desc;
			this._strings = {}; //is an object instead of an array so we can get a value's real index if one before it is skipped
			let re = /\S/;
			if (re.test(str1))
				this._strings[1] = str1;
			if (re.test(str2))
				this._strings[2] = str2;
			if (re.test(str3))
				this._strings[3] = str3;
			if (re.test(str4))
				this._strings[4] = str4;
			if (re.test(str5))
				this._strings[5] = str5;
			if (re.test(str6))
				this._strings[6] = str6;
			if (re.test(str7))
				this._strings[7] = str7;
			if (re.test(str8))
				this._strings[8] = str8;
			if (re.test(str9))
				this._strings[9] = str9;
			if (re.test(str10))
				this._strings[10] = str10;
			if (re.test(str11))
				this._strings[11] = str11;
			if (re.test(str12))
				this._strings[12] = str12;
			if (re.test(str13))
				this._strings[13] = str13;
			if (re.test(str14))
				this._strings[14] = str14;
			if (re.test(str15))
				this._strings[15] = str15;
			if (re.test(str16))
				this._strings[16] = str16;
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
			return this.convertType();
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
			switch (this._ot) {
				case 1:
					return "OCG";
				case 2:
					return "TCG";
				case 3:
					return "TCG/OCG";
				case 4:
					return "Anime";
				case 8:
					return "Illegal";
				case 16:
					return "Video Game";
				case 32:
					return "Custom";
				default:
					return "Null OT";
			}
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

		convertType() {
			let types = [];
			if (this._type & 0x1) {
				types.push("Monster");
			}
			if (this._type & 0x2) {
				types.push("Spell");
			}
			if (this._type & 0x4) {
				types.push("Trap");
			}
			//normal goes here in numeric order but I put it at the end so that it's at the end of any list of types
			//effect goes here in numeric order but I put it at the end so that it's at the end of any list of types
			if (this._type & 0x40) {
				types.push("Fusion");
			}
			if (this._type & 0x80) {
				types.push("Ritual");
			}
			if (this._type & 0x200) {
				types.push("Spirit");
			}
			if (this._type & 0x400) {
				types.push("Union");
			}
			if (this._type & 0x800) {
				types.push("Gemini");
			}
			if (this._type & 0x1000) {
				types.push("Tuner");
			}
			if (this._type & 0x2000) {
				types.push("Synchro");
			}
			if (this._type & 0x4000) {
				types.push("Token");
			}
			if (this._type & 0x10000) {
				types.push("Quick-Play");
			}
			if (this._type & 0x20000) {
				types.push("Continuous");
			}
			if (this._type & 0x40000) {
				types.push("Equip");
			}
			if (this._type & 0x80000) {
				types.push("Field");
			}
			if (this._type & 0x100000) {
				types.push("Counter");
			}
			if (this._type & 0x200000) {
				types.push("Flip");
			}
			if (this._type & 0x400000) {
				types.push("Toon");
			}
			if (this._type & 0x800000) {
				types.push("Xyz");
			}
			if (this._type & 0x1000000) {
				types.push("Pendulum");
			}
			if (this._type & 0x2000000) {
				types.push("Special Summon");
			}
			if (this._type & 0x4000000) {
				types.push("Link");
			}
			if (this._type & 0x10000000) {
				types.push("Armor");
			}
			if (this._type & 0x20000000) {
				types.push("Plus");
			}
			if (this._type & 0x40000000) {
				types.push("Minus");
			}
			if (this._type & 0x10) {
				types.push("Normal");
			}
			if (this._type & 0x20) {
				types.push("Effect");
			}
			return types;
		}

		isType(tpe) {
			if (this._type & tpe) { //this will usually be enough...
				return true
			}
			let tempType = this._type;
			if (tempType >= 0x100000000 && tpe >= 0x100000000) { //...except Javascript can't do bitwise operations on Numbers greater than 32-bit
				tempType -= (tempType & 0xffffffff); //so MLD wrote this magic function to replicate & for this use case
				while (tempType > 0xffffffff) {
					tempType -= 0xffffffff;
				}
				let ttpe = tpe - (tpe & 0xffffffff);
				while (ttpe > 0xffffffff) {
					ttpe -= 0xffffffff;
				}
				return tempType & ttpe;
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
			let races = [];
			if (this._race & 0x1) {
				races.push("Warrior");
			}
			if (this._race & 0x2) {
				races.push("Spellcaster");
			}
			if (this._race & 0x4) {
				races.push("Fairy");
			}
			if (this._race & 0x8) {
				races.push("Fiend");
			}
			if (this._race & 0x10) {
				races.push("Zombie");
			}
			if (this._race & 0x20) {
				races.push("Machine");
			}
			if (this._race & 0x40) {
				races.push("Aqua");
			}
			if (this._race & 0x80) {
				races.push("Pyro");
			}
			if (this._race & 0x100) {
				races.push("Rock");
			}
			if (this._race & 0x200) {
				races.push("Winged Beast");
			}
			if (this._race & 0x400) {
				races.push("Plant");
			}
			if (this._race & 0x800) {
				races.push("Insect");
			}
			if (this._race & 0x1000) {
				races.push("Thunder");
			}
			if (this._race & 0x2000) {
				races.push("Dragon");
			}
			if (this._race & 0x4000) {
				races.push("Beast");
			}
			if (this._race & 0x8000) {
				races.push("Beast-Warrior");
			}
			if (this._race & 0x10000) {
				races.push("Dinosaur");
			}
			if (this._race & 0x20000) {
				races.push("Fish");
			}
			if (this._race & 0x40000) {
				races.push("Sea Serpent");
			}
			if (this._race & 0x80000) {
				races.push("Reptile");
			}
			if (this._race & 0x100000) {
				races.push("Psychic");
			}
			if (this._race & 0x200000) {
				races.push("Divine-Beast");
			}
			if (this._race & 0x400000) {
				races.push("Creator God");
			}
			if (this._race & 0x800000) {
				races.push("Wyrm");
			}
			if (this._race & 0x1000000) {
				races.push("Cyberse");
			}
			if (this._race & 0x80000000) {
				races.push("Yokai");
			}
			if (this._race > 0xffffffff) { //over 32-bit JS suddenly can't handle bitwise operations, so MLD worked some magic
				let tempRace = _race
				tempRace -= (tempRace & 0xffffffff);
				while (tempRace > 0xffffffff) {
					tempRace -= 0xffffffff;
				}
				if (tempRace & 0x1) {
					races.push("Charisma");
				}
			}
			if (races.length === 0) {
				return ["???"];
			} else {
				return races;
			}
		}

		convertAtt() {
			let atts = [];
			if (this._attribute & 0x1) {
				atts.push("EARTH");
			}
			if (this._attribute & 0x2) {
				atts.push("WATER");
			}
			if (this._attribute & 0x4) {
				atts.push("FIRE");
			}
			if (this._attribute & 0x8) {
				atts.push("WIND");
			}
			if (this._attribute & 0x10) {
				atts.push("LIGHT");
			}
			if (this._attribute & 0x20) {
				atts.push("DARK");
			}
			if (this._attribute & 0x40) {
				atts.push("DIVINE");
			}
			if (this._attribute & 0x80) {
				atts.push("LAUGH");
			}
			if (this._attribute > 0xffffffff) { //over 32-bit JS suddenly can't handle bitwise operations, so MLD worked some magic
				let tempAtt = this._attribute
				tempAtt -= (tempAtt & 0xffffffff);
				while (tempAtt > 0xffffffff) {
					tempAtt -= 0xffffffff;
				}
				/*if (tempAtt & 0x1) {
					atts.push("No attribute yet");
				}*/
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
				lines.forEach(function(key, index) {
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
}