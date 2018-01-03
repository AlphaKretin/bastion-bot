module.exports = function(setcodes) {
	return class Card {
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
			if ((this._type & tpe) === tpe) { //this will usually be enough...
				return true
			}
			if (this._type >= 0x100000000 || tpe >= 0x100000000) { //...except Javascript can't do bitwise operations on Numbers greater than 32-bit
				let tempType1 = Math.floor(this._type / 0x100000000);
				let tempType2 = this._type & 0xffffffff;
				let ttpe1 = Math.floor(tpe / 0x100000000);
				let ttpe2 = tpe & 0xffffffff;
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
			//over 32-bit JS suddenly can't handle bitwise operations, so edo9300 worked some magic
			let tempRace = Math.floor(this._race / 0x100000000);
			if (tempRace & 0x1) {
				races.push("Charisma");
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
			//over 32-bit JS suddenly can't handle bitwise operations, so edo9300 worked some magic
			let tempAtt = Math.floor(this._attribute / 0x100000000);
			/*if (tempAtt & 0x1) {
				atts.push("No attribute yet");
			}*/
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