//This file handles run-time reading and writing of config options. 
//If you want to edit the base config options, edit config.json in the config folder.
const fs = require("fs");

module.exports = function() {
	let conf = JSON.parse(fs.readFileSync("config/config.json", "utf8"));
	if (conf.imageUrl) {
		//a bunch of stuff relies on images, and other config fields related to them only need to be checked if images exist
		if (!conf.imageUrlAnime) {
			conf.imageUrlAnime = conf.imageUrl;
			console.warn("URL for anime image source not found at conf.imageUrlAnime! Defaulting to same source as official cards, " + conf.imageUrl + "!");
		}
		if (!conf.imageUrlCustom) {
			conf.imageUrlCustom = conf.imageUrl;
			console.warn("URL for custom image source not found at conf.imageUrlCustom! Defaulting to same source as official cards, " + conf.imageUrl + "!");
		}
		if (!conf.imageSize) {
			conf.imageSize = 100;
			console.warn("Size for images not found at conf.imageSize! Defaulting to " + conf.imageSize + "!");
		}
		if (!conf.triviaTimeLimit) {
			conf.triviaTimeLimit = 30000;
			console.warn("No time limit for trivia found at conf.triviaTimeLimit! Defaulting to " + conf.triviaTimeLimit + "!");
		}
		if (!conf.triviaHintTime) {
			conf.triviaHintTime = 10000;
			console.warn("No hint time for trivia found at conf.triviaHintTime! Defaulting to " + conf.triviaHintTime + "!");
		}
		if (!conf.triviaMaxRounds) {
			conf.triviaMaxRounds = 20;
			console.warn("No hint time for trivia found at conf.triviaMaxRounds! Defaulting to " + conf.triviaMaxRounds + "!");
		}
		if (!conf.triviaLocks) {
			conf.triviaLocks = {};
			console.warn("No specifications for channels to lock trivia to found at conf.triviaLocks! Defaulting to nothing, configure with \".tlock\" command!");
		}
		if (!conf.imageExt) {
			conf.imageExt = "png";
			console.warn("No file extension for images found at conf.imageExt! Defaulting to " + conf.imageExt + "!");
		}
	} else {
		console.warn("URL for image source not found at conf.imageUrl! Image lookup and trivia will be disabled.");
	}

	if (conf.emoteMode > 0) {
		if (!conf.emotesDB) {
			console.warn("Emote database not found at conf.emotesDB! Emotes display will be disabled.");
		} //if it does exist, loaded into the class later
	} else if (conf.emoteMode == null) { //soft check for null also catches undefined. Check this way because 0 is a valid value, but falsy.
		conf.emoteMode = 0;
		console.warn("Emote mode specification not found at conf.emoteMode! Defaulting to " + conf.emoteMode + "!");
	}

	if (conf.messageMode == null) {
		conf.messageMode = 0;
		console.warn("Message mode specification not found at conf.messageMode! Defaulting to " + conf.messageMode + "!");
	}
	if (conf.messageMode > 0 && !conf.embedColour) {
		if (conf.embedColor) {
			conf.embedColour = conf.embedColor;
			delete conf.embedColor;
		} else {
			conf.embedColour = 0x1;
			console.warn("Embed Colour specification not found at conf.embedColour! Defaulting to " + conf.embedColour + "!");
		}
	}
	if (conf.messageMode > 0 && !conf.embedColourDB) {
		if (conf.embedColorDB) {
			conf.embedColourDB = conf.embedColorDB;
			delete conf.embedColorDB;
		} else {
			console.warn("Embed Colour database not found at conf.embedColourDB! Card Type specific embed Colour will be set to default.");
		}	
	} //if it does exist, loaded into the class later

	if (conf.scriptUrl) {
		if (!conf.scriptUrlAnime) {
			conf.scriptUrlAnime = conf.scriptUrl;
			console.warn("URL for anime script source not found at conf.scriptUrlAnime! Defaulting to same source as official cards, " + conf.scriptUrl + "!");
		}
		if (!conf.scriptUrlCustom) {
			conf.scriptUrlCustom = conf.scriptUrl;
			console.warn("URL for custom script source not found at conf.scriptUrlCustom! Defaulting to same source as official cards, " + conf.scriptUrl + "!");
		}
		if (!conf.scriptUrlBackup) {
			console.warn("URL for backup script source not found at conf.scriptUrlBackup! The bot will not try to find an alternative to missing scripts!");
		} else if (typeof conf.scriptUrlBackup === "string") {
			conf.scriptUrlBackup = [ conf.scriptUrlBackup ];
		}
	} else {
		console.warn("URL for script source not found at conf.scriptUrl! Script lookup will be disabled.");
	}

	if (!conf.prefix) {
		conf.prefix = ".";
		console.warn("No prefix found at conf.prefix! Defaulting to \"" + conf.prefix + "\"!");
	}
	
	if (!conf.longStr) {
		conf.longStr = "...\n__Type `" + conf.prefix + "long` to be PMed the rest!__";
		console.warn("No long message string found at conf.longStr! Defaulting to \"" + conf.longStr + "\"!");
	}

	if (!conf.helpMessage) {
		conf.helpMessage = "I am a Yu-Gi-Oh! card bot made by AlphaKretin#7990.\nPrice data is from the <https://yugiohprices.com> API.\nYou can find my help file and source here: <https://github.com/AlphaKretin/bastion-bot/>\nYou can support my development on Patreon here: <https://www.patreon.com/alphakretinbots>\nType `" + conf.prefix + "commands` to be DMed a short summary of my commands without going to an external website.";
		console.warn("Help message not found at console.helpMessage! Defaulting to \"" + conf.helpMessage + "\"!");
	}

	if (!conf.maxSearches) {
		conf.maxSearches = 3;
		console.warn("No upper limit on searches in one message found at conf.maxSearches! Defaulting to " + conf.maxSearches + "!");
	}

	if (!conf.defaultLanguage) {
		conf.defaultLanguage = "en";
		console.warn("Default language not found at conf.defaultLanguage! Defaulting to " + conf.defaultLanguage + "!");
	}

	if (!conf.rulingLanguage) {
		console.warn("Japanese language for rulings not found at conf.rulingLanguage! Backup ruling search will be disabled.");
	}

	if (!conf.fuseOptions) {
		conf.fuseOptions = {
			shouldSort: true,
			includeScore: true,
			threshold: 0.5,
			location: 0,
			distance: 100,
			maxPatternLength: 57,
			minMatchCharLength: 2,
			keys: [
				"name"
			]
		};
		console.warn("Settings for fuse.js not found at conf.fuseOptions! Using defaults!");
	}

	if (!conf.staticDBs) {
		conf.staticDBs = {};
		conf.staticDBs[conf.defaultLanguage][0] = ["cards.cdb"];
		console.warn("List of non-updating card databases not found at conf.staticDBs! Defaulting to one database named " + conf.staticDBs[conf.defaultLanguage][0] + ".");
	}
	
	if (conf.liveDBs) {
		if (conf.deleteOldDBs == null) {
			conf.deleteOldDBs = false;
			console.warn("Choice whether to delete old live-update databases not found at conf.deleteOldDBs! Default to " + conf.deleteOldDBs + "!");
		}
	} else {
		console.warn("List of live-updating databases not found at conf.liveDBs! Defaulting to none, and live update will populate it if enabled!");
		conf.liveDBs = {};
	}

	if (!conf.botOwner) {
		console.warn("Bot owner's ID not found at conf.botOwner! Owner commands will be disabled.");
	}

	if (!conf.scriptFunctions) {
		console.warn("Path to function library not found at conf.scriptFunctions! Function library will be disabled!");
	}
	if (!conf.scriptConstants) {
		console.warn("Path to constant library not found at conf.scriptConstants! Constant library will be disabled!");
	}

	if (!conf.scriptParams) {
		console.warn("Path to parameter library not found at conf.scriptParams! Parameter library will be disabled!");
	}

	if (!conf.skillDB) {
		console.warn("Path to Duel Links Skill database not found at conf.skillDB! Skill lookup will be disabled.");
	}

	if (!conf.sheetsDB) {
		console.warn("Sheets database not found at conf.sheetsDB! JSON updating will be disabled.");
	}

	if (conf.debugOutput == null) {
		console.warn("Choice whether to display debug information not found at conf.debugOutput! Defaulting to not displaying it.");
	}

	if (!conf.shortcutDB) {
		conf.shortcutDB = "shortcuts.json";
		console.warn("Filename for shortcuts file not found at conf.shortcutDB! Defaulting to " + conf.shortcutDB + ".");
	}

	if (!conf.setcodesDB) {
		conf.setcodesDB = "setcodes.json";
		console.warn("Filename for setcodes file not found at conf.setcodesDB! Defaulting to " + conf.setcodesDB + ".");
	}

	if (!conf.lflistDB) {
		conf.lflistDB = "lflist.json";
		console.warn("Filename for banlist file not found at conf.lflistDB! Defaulting to " + conf.lflistDB + ".");
	}

	if (!conf.statsDB) {
		conf.statsDB = "stats.json";
		console.warn("Filename for stats file not found at conf.statsDB! Defaulting to " + conf.statsDB + ".");
	}

	if (!conf.stringsDB) {
		conf.stringsDB = "strings.json";
		console.warn("Filename for translation strings file not found at conf.stringsDB! Defaulting to " + conf.stringsDB + ".");
	}

	if (!conf.updateRepos) {
		console.warn("List of GitHub repositories to update from not found at conf.updateRepos! Live database update will be disabled.");
	}

	if (!conf.setcodeSource) {
		console.warn("Online source for setcodes to update from not found at conf.setcodeSource! Live setcode update will be disabled.");
	}

	if (!conf.lflistSource) {
		console.warn("Online source for banlist to update from not found at conf.lflistSource! Live banlist update will be disabled.");
	}
	let Config = class config {
		constructor(conf) {
			this._conf = conf;
			if (conf.emotesDB) {
				this._emotesDB = JSON.parse(fs.readFileSync("config/" + conf.emotesDB, "utf-8"));
			}
			if (conf.messageMode > 0 && conf.embedColourDB) {
				this._embcDB = JSON.parse(fs.readFileSync("config/" + conf.embedColourDB, "utf-8"));
			}
			if (conf.sheetsDB) {
				this._sheetsDB = JSON.parse(fs.readFileSync("config/" + conf.sheetsDB, "utf-8"));
			}
		}

		get emotesDB() {
			return this._emotesDB;
		}

		get embcDB() {
			return this._embcDB;
		}

		get sheetsDB() {
			return this._sheetsDB;
		}

		set liveDBs(obj) {
			this._conf.liveDBs = obj;
			fs.writeFileSync("config/config.json", JSON.stringify(this._conf, null, 4), "utf8");
		}

		set triviaLocks(obj) {
			this._conf.triviaLocks = obj;
			fs.writeFileSync("config/config.json", JSON.stringify(this._conf, null, 4), "utf8");
		}

		getConfig(name, serverID) {
			if (name && name in Config.fieldList) {
				if (serverID && this._conf[serverID] && this._conf[serverID][name]) {
					return this._conf[serverID][name];
				} else {
					return this._conf[name];
				}
			}
			console.error("Error: getConfig called with invalid name: " + name);
		}

		setConfig(name, val, serverID) {
			if (name && Config.fieldList[name] != null && Config.fieldList[name].configable && serverID) {
				if (val != null) {
					if (!this._conf[serverID]) {
						this._conf[serverID] = {};
					}
					if (Config.fieldList[name].convert) {
						val = Config.fieldList[name].convert(val);
					}
					if (!Config.fieldList[name].chk || Config.fieldList[name].chk(val, serverID)) {
						this._conf[serverID][name] = val;
						fs.writeFileSync("config/config.json", JSON.stringify(this._conf, null, 4), "utf8");
						return true;
					} else {
						return false;
					}
				} else {
					if (!this._conf[serverID] || !this._conf[serverID][name]) {
						return false;
					}
					delete this._conf[serverID][name];
					fs.writeFileSync("config/config.json", JSON.stringify(this._conf, null, 4), "utf8");
					return true;
				}	
			} else {
				return false;
			}
		}
	};

	const boolInt = val => parseInt(val.toLowerCase().replace("false", 0).replace("true", 1));

	Config.fieldList = {
		token: { configable: false },
		prefix: { configable: true, convert: val => ( val.toString() || val ) },
		imageUrl: { configable: false },
		imageUrlAnime: { configable: false },
		imageUrlCustom: { configable: false },
		imageSize: { configable: true, convert: val => boolInt(val), chk: val => val <= c.getConfig("imageSize") }, //forces to be less than default for stability
		triviaTimeLimit: { configable: true, convert: val => boolInt(val), chk: (val, serverID) => (val > c.getConfig("triviaHintTime", serverID)) && val > 0 },
		triviaHintTime: { configable: true, convert: val => boolInt(val), chk: (val, serverID) => val < c.getConfig("triviaTimeLimit", serverID) },
		triviaMaxRounds: { configable: true, convert: val => boolInt(val), chk: val => val > 0 },
		triviaLocks: { configable: false }, //configured by other command
		imageExt: { configable: false },
		emoteMode: { configable: true, convert: val => boolInt(val), chk: val => c.emotesDB && val >= 0 && val <= 2 },
		emotesDB: { configable: false },
		messageMode: { configable: true, convert: val => boolInt(val), chk: val => val >= 0 },
		embedColour: { configable: true, convert: val => boolInt(val), chk: val => val >= 0 && val <= 0xffffff },
		scriptUrl: { configable: false },
		scriptUrlAnime: { configable: false },
		scriptUrlCustom: { configable: false },
		scriptUrlBackup: { configable: false },
		longStr: { configable: false },
		helpMessage: { configable: false },
		maxSearches: { configable: true, convert: val => boolInt(val), chk: val => val <= c.getConfig("maxSearches") },
		defaultLanguage: { configable: false },
		rulingLanguage: { configable: false },
		fuseOptions: { configable: false },
		staticDBs: { configable: false },
		liveDBs: { configable: false },
		deleteOldDBs: { configable: false },
		botOwner: { configable: false },
		scriptFunctions: { configable: false },
		scriptConstants: { configable: false },
		scriptParams: { configable: false },
		skillDB: { configable: false },
		sheetsDB: { configable: false },
		debugOutput: { configable: false },
		shortcutDB: { configable: false },
		setcodesDB: { configable: false },
		lflistDB: { configable: false },
		statsDB: { configable: false },
		stringsDB: { configable: false },
		updateRepos: { configable: false },
		setcodeSource: { configable: false },
		lflistSource: { configable: false }
	};
	let c = new Config(conf);
	return [c, Config];
};