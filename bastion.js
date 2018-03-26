const fs = require("fs");

let config = JSON.parse(fs.readFileSync("config/config.json", "utf8"));
//load data from JSON. Expected values can be intuited from console feedback or seen in the readme.
if (!config.token) {
	console.error("No Discord user token found at config.token! Exiting..."); //need the token to work as a bot, rest can be left out or defaulted. 
	process.exit();
}

let imageUrlMaster;
let imageUrlAnime;
let imageUrlCustom;
//these defaults are overwritten by what's in the config, if possible
let imageSize = 100;
let triviaTimeLimit = 30000;
let triviaHintTime = 10000;
let triviaMaxRounds = 20;
let triviaLocks = {};
let imageExt = "png";
if (config.imageUrl) {
	imageUrlMaster = config.imageUrl;
	//a bunch of stuff relies on images, and other config fields related to them only need to be checked if images exist
	if (config.imageUrlAnime) {
		imageUrlAnime = config.imageUrlAnime;
	} else {
		imageUrlAnime = imageUrlMaster;
		console.warn("URL for anime image source not found at config.imageUrlAnime! Defaulting to same source as official cards, " + imageUrlMaster + "!");
	}
	if (config.imageUrlCustom) {
		imageUrlCustom = config.imageUrlCustom;
	} else {
		imageUrlCustom = imageUrlMaster;
		console.warn("URL for custom image source not found at config.imageUrlCustom! Defaulting to same source as official cards, " + imageUrlMaster + "!");
	}
	if (config.imageSize) {
		imageSize = config.imageSize;
	} else {
		console.warn("Size for images not found at config.imageSize! Defaulting to " + imageSize + "!");
	}
	if (config.triviaTimeLimit) {
		triviaTimeLimit = config.triviaTimeLimit;
	} else {
		console.warn("No time limit for trivia found at config.triviaTimeLimit! Defaulting to " + triviaTimeLimit + "!");
	}
	if (config.triviaHintTime) {
		triviaHintTime = config.triviaHintTime;
	} else {
		console.warn("No hint time for trivia found at config.triviaHintTime! Defaulting to " + triviaHintTime + "!");
	}
	if (config.triviaMaxRounds) {
		triviaMaxRounds = config.triviaMaxRounds;
	} else {
		console.warn("No hint time for trivia found at config.triviaMaxRounds! Defaulting to " + triviaMaxRounds + "!");
	}
	if (config.triviaLocks) {
		triviaLocks = config.triviaLocks;
	} else {
		console.warn("No specifications for channels to lock trivia to found at config.triviaLocks! Defaulting to nothing, configure with \".tlock\" command!");
	}
	if (config.imageExt) {
		imageExt = config.imageExt;
	} else {
		console.warn("No file extension for images found at config.imageExt! Defaulting to " + imageExt + "!");
	}
} else {
	console.warn("URL for image source not found at config.imageUrl! Image lookup and trivia will be disabled.");
}

let emoteMode = 0;
let emoteDB;
let thumbsup = "👍";
let thumbsdown;

if (config.emoteMode && config.emoteMode > 0 && config.emotesDB) {
	emoteMode = config.emoteMode;
	let path = "config/" + config.emotesDB;
	emoteDB = JSON.parse(fs.readFileSync(path, "utf-8"));
	thumbsup = emoteDB["thumbsup"];
	if (emoteDB["thumbsdown"]) {
		thumbsdown = emoteDB["thumbsdown"];
	}
} else if (config.emoteMode && config.emoteMode > 0) {
	console.warn("Emote database not found at config.emotesDB! Emotes display will be disabled.");
} else if (config.emoteMode === undefined || config.emoteMode === null) {
	console.warn("Emote mode specification not found at config.emoteMode! Defaulting to " + emoteMode + "!");
}

let messageMode = 0;
let embedColor = 0x1;
let embcDB;

if (config.messageMode || config.messageMode === 0) {
	messageMode = config.messageMode;
} else {
	console.warn("Message mode specification not found at config.messageMode! Defaulting to " + messageMode + "!");
}
if (messageMode > 0 && config.embedColor) {
	embedColor = config.embedColor;
} else if (messageMode > 0) {
	console.warn("Embed color specification not found at config.embedColor! Defaulting to " + embedColor + "!");
}
if (messageMode > 0 && config.embedColorDB) {
	let path = "config/" + config.embedColorDB;
	embcDB = JSON.parse(fs.readFileSync(path, "utf-8"));
} else if (messageMode > 0) {
	console.warn("Embed color database not found at config.embedColorDB! Card Type specific embed color will be set to default.");
}

let scriptUrlMaster;
let scriptUrlAnime;
let scriptUrlCustom;
let scriptUrlBackup;
if (config.scriptUrl) {
	scriptUrlMaster = config.scriptUrl;
	if (config.scriptUrlAnime) {
		scriptUrlAnime = config.scriptUrlAnime;
	} else {
		scriptUrlAnime = scriptUrlMaster;
		console.warn("URL for anime script source not found at config.scriptUrlAnime! Defaulting to same source as official cards, " + scriptUrlMaster + "!");
	}
	if (config.scriptUrlCustom) {
		scriptUrlCustom = config.scriptUrlCustom;
	} else {
		scriptUrlCustom = scriptUrlMaster;
		console.warn("URL for custom script source not found at config.scriptUrlCustom! Defaulting to same source as official cards, " + scriptUrlMaster + "!");
	}
	if (config.scriptUrlBackup) {
		scriptUrlBackup = config.scriptUrlBackup;
	} else {
		console.warn("URL for backup script source not found at config.scriptUrlBackup! Bastion will not try to find an alternative to missing scripts!");
	}
} else {
	console.warn("URL for script source not found at config.scriptUrl! Script lookup will be disabled.");
}

let pre = ".";
if (config.prefix) {
	pre = config.prefix;
} else {
	console.warn("No prefix found at config.prefix! Defaulting to \"" + pre + "\"!");
}
let longStr = "...\n__Type `" + pre + "long` to be PMed the rest!__";
if (config.longStr) {
	longStr = config.longStr;
} else {
	console.warn("No long message string found at config.longStr! Defaulting to \"" + longStr + "\"!");
}
let helpMessage = "I am a Yu-Gi-Oh! card bot made by AlphaKretin#7990.\nPrice data is from the <https://yugiohprices.com> API.\nYou can find my help file and source here: <https://github.com/AlphaKretin/bastion-bot/>\nYou can support my development on Patreon here: <https://www.patreon.com/alphakretinbots>\nType `" + pre + "commands` to be DMed a short summary of my commands without going to an external website.";
if (config.helpMessage) {
	helpMessage = config.helpMessage;
} else {
	console.warn("Help message not found at console.helpMessage! Defaulting to \"" + helpMessage + "\"!");
}

let maxSearches = 3;
if (config.maxSearches) {
	maxSearches = config.maxSearches;
} else {
	console.warn("No upper limit on searches in one message found at config.maxSearches! Defaulting to " + maxSearches + "!");
}

let defaultLang = "en";
if (config.defaultLanguage) {
	defaultLang = config.defaultLanguage;
} else {
	console.warn("Default language not found at config.defaultLanguage! Defaulting to " + defaultLang + "!");
}

let rulingLang;
if (config.rulingLanguage) {
	rulingLang = config.rulingLanguage;
} else {
	console.warn("Japanese language for rulings not found at config.rulingLanguage! Backup ruling search will be disabled.");
}

let options = {
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
if (config.fuseOptions)
	options = config.fuseOptions;
else {
	console.warn("Settings for fuse.js not found at config.fuseOptions! Using defaults!");
}

const GitHubApi = require("github");
let github = new GitHubApi({
	debug: false
});

let dbs = {};
dbs[defaultLang] = ["cards.cdb"];
let staticDBs = {};
staticDBs[defaultLang] = ["cards.cdb"];
if (config.staticDBs) {
	staticDBs = config.staticDBs;
	dbs = JSON.parse(JSON.stringify(config.staticDBs));
	if (config.liveDBs) {
		Object.keys(config.liveDBs).forEach(lang => {
			if (dbs[lang]) {
				dbs[lang] = dbs[lang].concat(config.liveDBs[lang]);
			} else {
				dbs[lang] = config.liveDBs[lang];
			}
		});
	} else {
		console.warn("List of live-updating databases not found at config.liveDBs! Defaulting to none, and live update will populate it if enabled!");
		config.liveDBs = {};
	}
} else {
	console.warn("List of non-updating card databases not found at config.staticDBs! Defaulting to one database named " + staticDBs[defaultLang][0] + ".");
}
let dbMemory = 33554432;
if (config.dbMemory) {
	dbMemory = config.dbMemory;
} else {
	console.warn("Size of memory allocated for card databases not found at config.dbMemory! Defaulting to " + dbMemory + ".");
}
let owner;
if (config.botOwner) {
	owner = config.botOwner;
} else {
	console.warn("Bot owner's ID not found at config.botOwner! Owner commands will be disabled.");
}

let libFunctions;
let libConstants;
let libParams;

let skills = [];
let skillNames = [];

function setJSON() { //this is a function because it needs to be repeated when it's updated
	if (config.scriptFunctions) {
		let path = "dbs/" + config.scriptFunctions;
		libFunctions = JSON.parse(fs.readFileSync(path, "utf-8"));
		libFunctions.forEach((func) => {
			if (!func.sig)
				func.sig = "";
		});
	} else {
		console.warn("Path to function library not found at config.scriptFunctions! Function library will be disabled!");
	}
	if (config.scriptConstants) {
		let path = "dbs/" + config.scriptConstants;
		libConstants = JSON.parse(fs.readFileSync(path, "utf-8"));
		libConstants.forEach((cons) => {
			if (!cons.val)
				cons.val = "";
			if (typeof cons.val === "number")
				cons.val = cons.val.toString();
		});
	} else {
		console.warn("Path to constant library not found at config.scriptFunctions! Constant library will be disabled!");
	}
	if (config.scriptParams) {
		let path = "dbs/" + config.scriptParams;
		libParams = JSON.parse(fs.readFileSync(path, "utf-8"));
		libParams.forEach((par) => {
			if (!par.type)
				par.type = "";
		});
	} else {
		console.warn("Path to parameter library not found at config.scriptFunctions! Parameter library will be disabled!");
	}

	if (config.skillDB) {
		let path = "dbs/" + config.skillDB;
		skills = JSON.parse(fs.readFileSync(path, "utf-8"));
		skillNames = [];
		for (let skill of skills) { //populate array of objects containing names for the sake of fuzzy search
			skillNames.push({
				name: skill.name,
			});
		}
		if (skillNames.length > 0) {
			skillFuse = new Fuse(skillNames, options);
		}
	} else {
		console.warn("Path to Duel Links Skill database not found at config.skillDB! Skill lookup will be disabled.");
	}
}

let sheetsDB;
const gstojson = require("google-spreadsheet-to-json");
if (config.sheetsDB) {
	sheetsDB = JSON.parse(fs.readFileSync("config/" + config.sheetsDB, "utf-8"));
} else {
	console.warn("Sheets database not found at config.sheetsDB! JSON updating will be disabled.");
}

let debugOutput = false;
if (config.debugOutput || config.debugOutput === false) {
	debugOutput = config.debugOutput;
} else {
	console.warn("Choice whether to display debug information not found at config.debugOutput! Defaulting to not displaying it.");
}

let shortsDB = "shortcuts.json";
if (config.shortcutDB) {
	shortsDB = config.shortcutDB;
} else {
	console.warn("Filename for shortcuts file not found at config.shortcutDB! Defaulting to " + shortsDB + ".");
}

let setsDB = "setcodes.json";
if (config.setcodesDB) {
	setsDB = config.setcodesDB;
} else {
	console.warn("Filename for setcodes file not found at config.setcodesDB! Defaulting to " + setsDB + ".");
}

let banDB = "lflist.json";
if (config.lflistDB) {
	banDB = config.lflistDB;
} else {
	console.warn("Filename for banlist file not found at config.lflistDB! Defaulting to " + banDB + ".");
}

let statsDB = "stats.json";
if (config.statsDB) {
	statsDB = config.statsDB;
} else {
	console.warn("Filename for stats file not found at config.statsDB! Defaulting to " + statsDB + ".");
}

let updateRepos;
if (config.updateRepos) {
	updateRepos = config.updateRepos;
} else {
	console.warn("List of GitHub repositories to update from not found at config.updateRepos! Live database update will be disabled.");
}

let setcodeSource;
if (config.setcodeSource) {
	setcodeSource = config.setcodeSource;
} else {
	console.warn("Online source for setcodes to update from not found at config.setcodeSource! Live setcode update will be disabled.");
}

let lflistSource;
if (config.lflistSource) {
	lflistSource = config.lflistSource;
} else {
	console.warn("Online source for banlist to update from not found at config.lflistSource! Live banlist update will be disabled.");
}

//more config files, all explained in the readme
let shortcuts = JSON.parse(fs.readFileSync("config/" + shortsDB, "utf8"));
let setcodes = JSON.parse(fs.readFileSync("config/" + setsDB, "utf8"));
let lflist = JSON.parse(fs.readFileSync("config/" + banDB, "utf8"));
let stats = JSON.parse(fs.readFileSync("config/" + statsDB, "utf8"));

let Card = require("./card.js")(setcodes); //initialises a "Card" Class, takes setcodes as an argument for handling archetypes as a class function

setInterval(() => {
	fs.writeFileSync("config/stats.json", JSON.stringify(stats), "utf8");
	console.log("Stats saved!");
}, 300000); //5 minutes

//discord setup 
const Discord = require("discord.io");

let bot = new Discord.Client({
	token: config.token,
	autorun: false //users can't interface with the bot until it's ready
});

bot.on("ready", () => {
	console.log("Logged in as %s - %s\n", bot.username, bot.id);
});

bot.on("disconnect", (err, code) => { //Discord API occasionally disconnects bots for an unknown reason.
	console.error("Disconnected with error code " + code + ". Reconnecting...");
	bot.connect();
});

//sql setup
Module = {
	TOTAL_MEMORY: dbMemory
};
const SQL = require("sql.js");
let cards = {};
let nameList = {};

//fuse setup
const Fuse = require("fuse.js");
let fuse = {};

function loadDBs() {
	cards = {};
	nameList = {};
	for (let lang in dbs) { //this reads the keys of an object loaded above, which are supposed to be the languages of the card databases in that field of the object
		console.log("loading " + lang + " database");
		let filebuffer = fs.readFileSync("dbs/" + lang + "/" + dbs[lang][0]);
		let db = new SQL.Database(filebuffer);
		nameList[lang] = [];
		cards[lang] = {};
		let contents = db.exec("select * from datas,texts where datas.id=texts.id"); //see SQL.js documentation/example for the format of this return, it's not the most intuitive
		db.close();
		for (let card of contents[0].values) {
			let car = new Card(card);
			cards[lang][car.code] = car;
		}
		if (dbs[lang].length > 1) { //a language can have multiple DBs, and if so their data needs to be loaded into the results from the first as if they were all one DB.
			console.log("loading additional " + lang + " databases");
			for (let i = 1; i < dbs[lang].length; i++) {
				let newbuffer = fs.readFileSync("dbs/" + lang + "/" + dbs[lang][i]);
				console.log("loading " + dbs[lang][i]);
				let newDB = new SQL.Database(newbuffer);
				let newContents = newDB.exec("select * from datas,texts where datas.id=texts.id");
				newDB.close();
				for (let newCard of newContents[0].values) {
					let newCar = new Card(newCard);
					cards[lang][newCar.code] = newCar;
				}
			}
		}
		Object.values(cards[lang]).forEach(card => {
			nameList[lang].push({
				name: card.name,
				id: card.code
			});
			if (card.alias > 0 && cards[lang][card.alias]) { //cards with an alias inherit their setcode from their alias
				card.setcode = cards[lang][card.alias].setcode;
			}
		});
		fuse[lang] = new Fuse(nameList[lang], options);
	}
}

async function dbUpdate() {
	return new Promise(resolve => {
		console.log("Starting CDB update!");
		let promises = [];
		dbs = JSON.parse(JSON.stringify(staticDBs));
		let oldDbs = {};
		for (let lang of Object.keys(updateRepos)) {
			if (config.liveDBs[lang])
				oldDbs[lang] = JSON.parse(JSON.stringify(config.liveDBs[lang]));
			config.liveDBs[lang] = [];
			for (let repo of updateRepos[lang]) {
				let arr = repo.split("/");
				if (!arr || arr.length < 2)
					continue;
				try {
					let prom;
					if (arr.length > 2) {
						prom = getGHContents(lang, arr[0], arr[1], arr.slice(2).join("/"));
					} else {
						prom = getGHContents(lang, arr[0], arr[1]);
					}
					prom.then(res => {
						config.liveDBs[lang] = config.liveDBs[lang].concat(res);
					});
					promises.push(prom);
				} catch (e) {
					console.error("Failed to download files from " + repo + "!");
					console.error(e);
				}
			}
		}
		Promise.all(promises).then(() => {
			Object.keys(config.liveDBs).forEach(lang => {
				if (dbs[lang]) {
					dbs[lang] = dbs[lang].concat(config.liveDBs[lang]);
				} else {
					dbs[lang] = config.liveDBs[lang];
				}
				for (let db of config.liveDBs[lang]) {
					if (oldDbs[lang])
						oldDbs[lang] = oldDbs[lang].filter(a => a !== db);
				}
				if (config.deleteOldDBs && oldDbs[lang] && oldDbs[lang].length > 0) {
					console.log("Deleting the following old databases in 10 seconds: ");
					console.log(oldDbs[lang]);
					setTimeout(() => {
						for (let db of oldDbs[lang]) {
							console.log("Deleting " + db + ".");
							fs.unlinkSync("dbs/" + lang + "/" + db);
						}
					}, 10000);
				}
			});
			loadDBs();
			fs.writeFileSync("config/config.json", JSON.stringify(config, null, 4), "utf8");
			resolve();
		});
	});
}

const request = require("request");
const https = require("https");
const url = require("url");
const jimp = require("jimp");
const filetype = require("file-type");

let skillFuse = {};
let updateFuncs = [];
if (sheetsDB)
	updateFuncs.push(updatejson);
else
	setJSON();
if (setcodeSource)
	updateFuncs.push(updateSetcodes);
if (updateRepos)
	updateFuncs.push(dbUpdate);
else 
	loadDBs();
if (lflistSource)
	updateFuncs.push(updateLflist);

function periodicUpdate() {
	return new Promise(async resolve => {
		let proms = [];
		for (let func of updateFuncs)
			proms.push(func());
		Promise.all(proms).then(() => resolve());
	});
}

setInterval(periodicUpdate, 1000 * 60 * 60 * 24);

periodicUpdate().then(() => {
	if (!bot.connected) {
		bot.connect();
	}
});

//these are used for various data that needs to persist between commands or uses of a command
let longMsg = "";
let gameData = {};
let searchPage = {};

//command declaration
let commandList = [{
	names: ["randcard", "randomcard"],
	func: randomCard,
	desc: "Display the description of a random card. See the readme for how you can filter what kind of card it shows."
},
{
	names: ["script"],
	func: script,
	chk: () => scriptUrlMaster,
	desc: "Displays the script of a card."
},
{
	names: ["trivia", "game", "guess"],
	func: trivia,
	chk: () => imageUrlMaster,
	desc: "Plays a game where you guess the name of a card by its artwork."
},
{
	names: ["tlock"],
	func: tlock,
	chk: (user, userID, channelID) => imageUrlMaster && checkForPermissions(userID, channelID, ["TEXT_MANAGE_MESSAGES"]), //User must have manage message permission
	desc: "Adds the current channel to a list of which trivia can only be played in channels from."
},
{
	names: ["matches", "match"],
	func: matches,
	chk: (user, userID, channelID) => !(channelID in gameData),
	desc: "Returns the top 10 cards with names similar to the text entered."
},
{
	names: ["set", "setcode", "archetype", "setname", "sets"],
	func: set,
	desc: "Converts between YGOPro setcodes and archetype names."
},
{
	names: ["id"],
	func: getSingleProp,
	chk: (user, userID, channelID) => !(channelID in gameData),
	desc: "Displays the ID of a card."
},
{
	names: ["notext", "stats"],
	func: getSingleProp,
	chk: (user, userID, channelID) => !(channelID in gameData),
	desc: "Displays the stats of a card, without its effect."
},
{
	names: ["effect", "cardtext"],
	func: getSingleProp,
	chk: (user, userID, channelID) => !(channelID in gameData),
	desc: "Displays the effect or text of a card, without its stats."
},
{
	names: ["strings"],
	func: strings,
	chk: (user, userID, channelID) => !(channelID in gameData),
	desc: "Displays the strings assinged to a card in YGOPro, such as descriptions of its effects or dialog boxes it may ask the player."
},
{
	names: ["deck"],
	func: deck,
	desc: "Converts an uploaded .ydk file to a list of cards contained within."
},
{
	names: ["commands"],
	func: commands,
	desc: "Displays a list of commands."
},
{
	names: ["rulings"],
	func: rulings,
	chk: (user, userID, channelID) => !(channelID in gameData),
	desc: "Returns a link to a card's ruling page on the OCG card database."
},
{
	names: ["top", "rankings", "rank"],
	func: rankings,
	desc: "Displays the most popular card searches, search inputs, and bot commands."
},
{
	names: ["function", "func", "f"],
	func: searchFunctions,
	chk: () => libFunctions,
	desc: "Searches for functions used in YGOPro scripting."
},
{
	names: ["constant", "const", "c"],
	func: searchConstants,
	chk: () => libConstants,
	desc: "Searches for constants used in YGOPro scripting."
},
{
	names: ["param", "parameter"],
	func: searchParams,
	chk: () => libParams,
	desc: "Searches for parameters used in the description of functions used in YGOPro scripting."
},
{
	names: ["p", "page"], //must be after param to avoid double-post
	func: libPage,
	chk: (user, userID, channelID) => searchPage[channelID],
	desc: "Changes the page of a function, constant or param search."
},
{
	names: ["d", "desc", "description"],
	func: libDesc,
	chk: (user, userID, channelID) => searchPage[channelID],
	desc: "Displays the description of an entry in a function, constant or param search."
},
{
	names: ["skill"],
	func: searchSkill,
	chk: () => skills.length > 0,
	desc: "Searches for a skill from Yu-Gi-Oh! Duel Links."
},
{
	names: ["servers", "serverlist"],
	func: servers,
	chk: (user, userID) => owner && owner.includes(userID),
	noTrack: true,
	desc: "Generates a list of servers the bot is in."
},
{
	names: ["update", "updatejson"],
	func: (user, userID, channelID, message, event) => periodicUpdate().then(() => sendMessage(user, userID, channelID, message, event, "Update complete!").catch(msgErrHandler)).catch(e => sendMessage(user, userID, userID, message, event, e).catch(msgErrHandler)),
	chk: (user, userID) => owner && owner.includes(userID),
	noTrack: true,
	desc: "Updates the data for cards, functions, skills, etc."
},
{
	names: ["long"],
	func: (user, userID, channelID, message, event) => sendMessage(user, userID, userID, message, event, longMsg).catch(msgErrHandler),
	chk: () => longMsg.length > 0,
	desc: "Sends the remainder of a message split up due to length."
},
{
	names: ["banlist", "lflist", "fllist"],
	func: banlist,
	desc: "Displays a Forbidden/Limited list stored within Bastion."
},
{
	names: ["banlink", "lflink", "fllink"],
	func: banlink,
	desc: "Provides a link to the official Forbidden/Limited list."
},
{
	names: ["yugi", "yugipedia"],
	func: yugi,
	desc: "Links a given page from the Yugipedia wiki."
}];

let helpCooldown = true;

bot.on("message", (user, userID, channelID, message, event) => {
	if (userID === bot.id || (bot.users[userID] && bot.users[userID].bot)) { //ignores own messages to prevent loops, and those of other bots just in case
		return;
	}
	let lowMessage = message.toLowerCase();
	for (let cmd of commandList) {
		for (let name of cmd.names) {
			if (lowMessage.startsWith(pre + name) && (!cmd.chk || cmd.chk(user, userID, channelID, message, event))) {
				cmd.func(user, userID, channelID, message, event, name, cmd.names[0]);
				if (!cmd.noTrack) {
					if (stats.cmdRankings[cmd.names[0]]) {
						stats.cmdRankings[cmd.names[0]]++;
					} else {
						stats.cmdRankings[cmd.names[0]] = 1;
					}
				}
				return;
			}
		}
	}
	if ((message.includes("<@" + bot.id + ">") || lowMessage.startsWith(pre + "help")) && helpCooldown) {
		//send help message
		sendMessage(user, userID, channelID, message, event, helpMessage).catch(msgErrHandler);
		helpCooldown = false;
		setTimeout(() => helpCooldown = true, 30000);
		if (stats.cmdRankings.help) {
			stats.cmdRankings.help++;
		} else {
			stats.cmdRankings.help = 1;
		}
	}
	if (channelID in gameData) {
		switch (gameData[channelID].game) { //switch statement where if would do to futureproof for adding more games
		case "trivia":
			answerTrivia(user, userID, channelID, message, event);
			break;
		default:
			break;
		}
		return;
	}
	let blockRe = /`{1,3}[\s\S\r\n]*?[\s\S\r\n][\s\S\r\n]*?`{1,3}/g; //gets all text between ``, to remove them, so they're not searched
	message = message.replace(blockRe, "");
	let re = /{(.*?)}/g; //gets text between {}
	let results = [];
	let regx;
	do {
		regx = re.exec(message);
		if (regx && validateReg(regx[1]))
			results.push(regx[1]);
	} while (regx);
	let results2 = [];
	if (imageUrlMaster) {
		let re2 = /<(.*?)>/g; //gets text between <>
		let regx2;
		do {
			regx2 = re2.exec(message);
			if (regx2 && validateReg(regx2[1]))
				results2.push(regx2[1]);
		} while (regx2);
	}
	if (results.length + results2.length > maxSearches) {
		sendMessage(user, userID, channelID, message, event, "You can only search up to " + maxSearches + " cards!").catch(msgErrHandler);
	} else {
		for (let result of results) {
			searchCard(result, false, user, userID, channelID, message, event); //second parameter here is whether to display image or not
			if (stats.cmdRankings["search (no image)"]) {
				stats.cmdRankings["search (no image)"]++;
			} else {
				stats.cmdRankings["search (no image)"] = 1;
			}
		}
		for (let result of results2) {
			searchCard(result, true, user, userID, channelID, message, event);
			if (stats.cmdRankings["search (with image)"]) {
				stats.cmdRankings["search (with image)"]++;
			} else {
				stats.cmdRankings["search (with image)"] = 1;
			}
		}
	}
});

bot.on("messageUpdate", (oldMsg, newMsg, event) => { //a few commands can be met by edit
	if (newMsg.author && newMsg.author.id === bot.id) { //have to check a lot of variables exist at all because for some stupid reason an embed being added also counts as editing a message. Dammit Discord
		return;
	}
	let lowMessage = newMsg.content && newMsg.content.toLowerCase();
	let channelID = newMsg.channel_id;
	if (!channelID)
		return;
	if (searchPage[channelID] && lowMessage && lowMessage.startsWith(pre + "p") && lowMessage.indexOf("param") === -1) {
		libPage(newMsg.author.username, newMsg.author.id, channelID, newMsg.content, event, "p");
	}
	if (searchPage[channelID] && lowMessage && lowMessage.startsWith(pre + "page") && lowMessage.indexOf("param") === -1) {
		libPage(newMsg.author.username, newMsg.author.id, channelID, newMsg.content, event, "page");
	}
	if (searchPage[channelID] && lowMessage && lowMessage.startsWith(pre + "d")) {
		libDesc(newMsg.author.username, newMsg.author.id, channelID, newMsg.content, event, "d");
	}
	if (searchPage[channelID] && lowMessage && lowMessage.startsWith(pre + "desc")) {
		libDesc(newMsg.author.username, newMsg.author.id, channelID, newMsg.content, event, "desc");
	}
	if (searchPage[channelID] && lowMessage && lowMessage.startsWith(pre + "description")) {
		libDesc(newMsg.author.username, newMsg.author.id, channelID, newMsg.content, event, "description");
	}
});

function commands(user, userID, channelID, message, event) {
	let out = "__**Command List**__\n";
	out += "Type a card name or ID between `{}` (or `<>` to include images) to see its profile.\n";
	for (let cmd of commandList) {
		if (!cmd.chk || cmd.chk(user, userID, channelID, message, event)) {
			out += "`" + pre + cmd.names[0] + "`"; 
			if (cmd.desc)
				out += ": " + cmd.desc;
			if (cmd.names.length > 1)
				out += " (Aliases: " + cmd.names.join(", ").replace(cmd.names[0] + ", ", "") + ")\n";
		}
	}
	out += "See the readme for details: <https://github.com/AlphaKretin/bastion-bot/>";
	if (out.length > 0) {
		let outArr = out.match(/[\s\S]{1,2000}/g); //splits text into 2k character chunks
		sendMessage(user, userID, userID, message, event, outArr[0]).then(() => {
			if (outArr[1])
				sendMessage(user, userID, userID, message, event, outArr[1]).catch(msgErrHandler);
		}).catch(msgErrHandler);
	}
}

async function randomCard(user, userID, channelID, message, event) { //anything that gets card data has to be async because getting the price involves a Promise
	try {
		let args = message.toLowerCase().split(" ");
		let code;
		let outLang = defaultLang;
		for (let arg of args) {
			if (arg in dbs) {
				outLang = arg;
			}
		}
		let ids = Object.keys(cards[outLang]);
		let argObj = parseFilterArgs(message.toLowerCase());
		if (Object.keys(argObj).length > 0) {
			let matches = [];
			for (let id of ids) { //gets a list of all cards that meet specified critera, before getting a random one of those cards
				if (randFilterCheck(id, argObj, outLang)) { //a number of filters can be specified in the command, and this checks that a card meets them
					matches.push(id);
				}
			}
			if (matches.length === 0) {
				bot.sendMessage({
					to: channelID,
					message: "Sorry, no cards match the criteria specified!"
				});
				return;
			}
			code = matches[Math.floor(Math.random() * matches.length)];
		} else {
			code = ids[Math.floor(Math.random() * ids.length)];
		}
		let out = await getCardInfo(code, outLang); //returns a list of IDs for the purposes of cards with multiple images, as well as of course the card's profile
		if (imageUrlMaster && args.includes("image")) {
			if (out[1].length == 1 && messageMode > 0) {
				sendLongMessage(out[0], user, userID, channelID, message, event, out[2], out[3], out[1][0], outLang);
			} else {
				postImage(out[1], out[0], outLang, user, userID, channelID, message, event, out[2], out[3]); //postImage also handles sending the message
			}
		} else {
			sendLongMessage(out[0], user, userID, channelID, message, event, out[2], out[3]); //in case a message is over 2k characters (thanks Ra anime), this splits it up
		}
	} catch (e) {
		console.error(e);
	}
}

//from hereon out, some functions and logic will be re-used from earlier functions - I won't repeat myself, just check that.
async function script(user, userID, channelID, message, event, name) {
	let input = message.slice((pre + name + " ").length);
	let args = input.split("|");
	let inLang = defaultLang;
	if (args.length > 1) {
		input = args[0];
		if (args[1] in dbs)
			inLang = args[1];
	}
	let inInt = parseInt(input);
	if (inInt in cards[inLang]) {
		try {
			let out = await getCardScript(cards[inLang][inInt]);
			sendLongMessage(out, user, userID, channelID, message, event);
		} catch (e) {
			console.error("Error with search by ID:");
			console.error(e);
		}
	} else { //if it wasn't an ID, the only remaining valid option is that it's a name
		try {
			let code = nameCheck(input, inLang); //this handles all the fuzzy search stuff
			if (code && code in cards[inLang]) {
				let out = await getCardScript(cards[inLang][code]);
				sendLongMessage(out, user, userID, channelID, message, event);
			} else {
				console.error("Invalid card ID or name, please try again.");
				return;
			}
		} catch (e) {
			console.error("Error with search by name:");
			console.error(e);
		}
	}
}

async function searchCard(input, hasImage, user, userID, channelID, message, event) {
	if (stats.inputRankings[input]) {
		stats.inputRankings[input]++;
	} else {
		stats.inputRankings[input] = 1;
	}
	let args = input.split(",");
	let inLang = args[args.length - 2] && args[args.length - 2].replace(/ /g, "").toLowerCase(); //expecting cardname,lang,lang
	let outLang = args[args.length - 1] && args[args.length - 1].replace(/ /g, "").toLowerCase();
	if (inLang in dbs && outLang in dbs) {
		input = args.splice(0, args.length - 2).join(",");
	} else {
		inLang = defaultLang;
		outLang = defaultLang;
	}
	let inInt = parseInt(input);
	if (inInt in cards[inLang]) {
		try {
			let alID = getBaseID(cards[inLang][inInt], outLang); //determines if the card should be tracked by its own ID, or its alias, and returns the appropriate ID.
			if (alID > -1) {
				if (stats.searchRankings[alID]) {
					stats.searchRankings[alID]++;
				} else {
					stats.searchRankings[alID] = 1;
				}
			}
			let out = await getCardInfo(inInt, outLang);
			if (hasImage) {
				if (out[1].length == 1 && messageMode > 0) {
					sendLongMessage(out[0], user, userID, channelID, message, event, out[2], out[3], out[1][0], outLang);
				} else {
					postImage(out[1], out[0], outLang, user, userID, channelID, message, event, out[2], out[3]); //postImage also handles sending the message
				}
			} else {
				sendLongMessage(out[0], user, userID, channelID, message, event, out[2], out[3]); //in case a message is over 2k characters (thanks Ra anime), this splits it up
			}
		} catch (e) {
			console.error("Error with search by ID:");
			console.error(e);
		}
	} else {
		try {
			let code = nameCheck(input, inLang);
			if (code && code in cards[outLang]) {
				let card = cards[outLang][code];
				let alID = getBaseID(card, outLang);
				if (alID > -1) {
					if (stats.searchRankings[alID]) {
						stats.searchRankings[alID]++;
					} else {
						stats.searchRankings[alID] = 1;
					}
				}
				let out = await getCardInfo(code, outLang);
				if (hasImage) {
					if (out[1].length == 1 && messageMode > 0) { //if it's embed mode, sendLongMessage handles embedding one image
						sendLongMessage(out[0], user, userID, channelID, message, event, out[2], out[3], out[1][0], outLang);
					} else {
						postImage(out[1], out[0], outLang, user, userID, channelID, message, event, out[2], out[3]); //postImage also handles sending the message
					}
				} else {
					sendLongMessage(out[0], user, userID, channelID, message, event, out[2], out[3]); //in case a message is over 2k characters (thanks Ra anime), this splits it up
				}
			} else {
				console.error("Invalid card or no corresponding entry in out language DB, please try again.");
				return;
			}
		} catch (e) {
			console.error("Error with search by name:");
			console.error(e);
		}
	}
}

function getCardInfo(code, outLang) {
	return new Promise((resolve, reject) => {
		if (!code || !cards[outLang][code]) {
			console.error("Invalid card ID, please try again.");
			reject("Invalid card ID, please try again.");
		}
		let card = cards[outLang][code];
		let alIDs = [code];
		if (card.alias > 0 && cards[outLang][card.alias]) { //if the card has an alias, e.g. IS the alt art
			let alCard = cards[outLang][card.alias];
			if (card.hasSameOT(alCard) && card.name === alCard.name) { //If the card with the alias is the same OT as the card with the base ID, then it's an alt art as opposed to an anime version or pre errata or something. However if the name is different it's a Fusion Sub or Harpie Lady.
				code = alCard.code;
				alIDs = [code];
				Object.values(cards[outLang]).forEach(tempCard => {
					if (tempCard.alias === code && tempCard.hasSameOT(alCard)) {
						alIDs.push(tempCard.code);
					}
				});
			}
		} else { //if other cards have this, the original, as an alias, they'll be noted here
			Object.values(cards[outLang]).forEach(tempCard => {
				if (tempCard.alias === code && tempCard.hasSameOT(card) && tempCard.name === card.name) {
					alIDs.push(tempCard.code);
				}
			});
		}
		let out = "__**" + card.name + "**__\n";
		out += "**ID**: " + alIDs.join("|") + "\n";
		if (card.sets) {
			out += "**Archetype**: " + card.sets.join(", ");
		}
		out += "\n";
		let stat = card.ot.join("/");
		Object.keys(lflist).forEach(key => { //keys of the banlist table are card IDs, values are number of copies allowed
			if (stat.includes(key)) {
				let lim = 3;
				if (lflist[key][code] || lflist[key][code] === 0) { //0 is falsy, so we need to check it explicitly. Ugh.
					lim = lflist[key][code];
				} else if (card.alias && (lflist[key][card.alias] || lflist[key][card.alias] === 0)) {
					lim = lflist[key][card.alias];
				}
				let re = new RegExp(key);
				stat = stat.replace(re, key + ": " + lim);
			}
		});
		request("https://yugiohprices.com/api/get_card_prices/" + card.name, (error, response, body) => { //https://yugiohprices.docs.apiary.io/#reference/checking-card-prices/check-price-for-card-name/check-price-for-card-name
			if (!error && response.statusCode === 200 && JSON.parse(body).status === "success") {
				let data = JSON.parse(body);
				let low;
				let hi;
				let avgs = [];
				for (let price of data.data) {
					if (price.price_data.status === "success") {
						if (!hi || price.price_data.data.prices.high > hi) {
							hi = price.price_data.data.prices.high;
						}
						if (!low || price.price_data.data.prices.low < low) {
							low = price.price_data.data.prices.low;
						}
						avgs.push(price.price_data.data.prices.average);
					}
				}
				if (avgs.length > 0) {
					let avg = (avgs.reduce((a, b) => a + b, 0)) / avgs.length;
					out += "**Status**: " + stat + " **Price**: $" + low.toFixed(2) + "-$" + avg.toFixed(2) + "-$" + hi.toFixed(2) + " USD\n";
				} else {
					out += "**Status**: " + stat + "\n";
				}
			} else {
				out += "**Status**: " + stat + "\n";
			}
			let embCT = getEmbCT(card);
			if (card.types.includes("Monster")) {
				let arrace = addEmote(card.race, "|");
				let typesStr;
				if (emoteMode < 2 && messageMode != 1) {
					typesStr = card.types.join("/").replace("Monster", arrace[emoteMode]);
				} else {
					typesStr = card.types.join("/").replace("Monster", arrace[0]);
					if (messageMode != 1) {
						typesStr += " " + arrace[1];
					}
				}
				out += "**Type**: " + typesStr + " **Attribute**: " + addEmote(card.attribute, "|")[emoteMode] + "\n";
				let lvName = "Level";
				if (card.types.includes("Xyz")) {
					lvName = "Rank";
				} else if (card.types.includes("Link")) {
					lvName = "Link Rating";
				}
				out += "**" + lvName + "**: " + card.level + " ";
				if (emoteMode > 0) {
					if (card.isType(0x1000000000)) { //is dark synchro
						out += emoteDB["NLevel"] + " ";
					} else {
						out += emoteDB[lvName] + " ";
					}
				}
				out += " **ATK**: " + card.atk + " ";
				if (card.def) {
					out += "**DEF**: " + card.def;
				} else {
					out += "**Link Markers**: " + card.markers;
				}
				if (card.types.includes("Pendulum")) {
					out += " **Pendulum Scale**: ";
					if (emoteMode > 0) {
						out += " " + card.lscale + emoteDB["L.Scale"] + " " + emoteDB["R.Scale"] + card.rscale + " ";
					} else {
						out += card.lscale + "/" + card.rscale;
					}
				}
				out += "\n";
				let cardText = card.desc;
				let textName = "Monster Effect";
				if (card.types.includes("Normal")) {
					textName = "Flavour Text";
				}
				if (cardText.length === 4) {
					out += "**" + cardText[2] + "**: " + cardText[0] + "\n**" + cardText[3] + "**: " + cardText[1];
				} else {
					out += "**" + textName + "**: " + cardText[0];
				}
			} else if (card.types.includes("Spell") || card.types.includes("Trap")) {
				let typeemote = addEmote(card.types, "/");
				if ((typeemote[0] == "Spell" || typeemote[0] == "Trap") && emoteMode > 0) {
					typeemote[1] += emoteDB["NormalST"];
					typeemote[2] += emoteDB["NormalST"];
				}
				if (card.isType(0x100)) { //is trap monster
					let arrace = addEmote(card.race, "|");
					let typesStr;
					if (emoteMode < 2 && messageMode != 1) {
						typesStr = arrace[emoteMode] + "/" + typeemote[emoteMode];
					} else {
						typesStr = arrace[0] + "/" + typeemote[0];
						if (messageMode != 1) {
							typesStr += " " + arrace[1] + typeemote[1];
						}
					}
					out += "**Type**: " + typesStr + " **Attribute**: " + addEmote(card.attribute, "|")[emoteMode] + "\n**Level**: " + card.level;
					if (emoteMode > 0) {
						out += " " + emoteDB["Level"];
					}
					out += "  **ATK**: " + card.atk + " **DEF**: " + card.def + "\n";
				} else {
					out += "**Type**: " + typeemote[emoteMode] + "\n";
				}
				out += "**Effect**: " + card.desc[0].replace(/\n/g, "\n");
			} else {
				out += "**Card Text**: " + card.desc[0].replace(/\n/g, "\n");
			}
			resolve([out, alIDs, embCT]);
		});
	});
}

async function postImage(code, out, outLang, user, userID, channelID, message, event, embCT) {
	try {
		let imageUrl = imageUrlMaster;
		let card = cards[outLang][code[0]];
		if (card.isAnime) {
			imageUrl = imageUrlAnime;
		}
		if (card.isCustom) {
			imageUrl = imageUrlCustom;
		}
		if (code.length > 1) {
			let pics = [];
			for (let cod of code) {
				let buffer = await downloadImage(imageUrl + cod + "." + imageExt, user, userID, channelID, message, event);
				if (filetype(buffer) && filetype(buffer).ext === imageExt) {
					pics.push(await new Promise((resolve, reject) => {
						jimp.read(buffer, (err, image) => {
							if (err) {
								reject(err);
							} else {
								resolve(image);
							}
						});
					}));
				}
			}
			let imgSize = pics[0].bitmap.width;
			let a = [];
			let b = [];
			while (pics.length) { //split array of images into groups of 4
				a.push(pics.splice(0, 4));
			}
			for (let pic of a) {
				let tempImg = pic[0];
				for (let i = 1; i < pic.length; i++) { //in each group, composite the 4 images side by side
					await new Promise((resolve, reject) => {
						new jimp(imgSize + tempImg.bitmap.width, imageSize, (err, image) => {
							if (err) {
								reject(err);
							} else {
								image.composite(tempImg, 0, 0);
								image.composite(pic[i], tempImg.bitmap.width, 0);
								tempImg = image;
								resolve(image);
							}
						});
					});
				}
				b.push(tempImg);
			}
			let outImg = b[0];
			if (b.length > 1) {
				for (let i = 1; i < b.length; i++) { //composite each group vertically
					await new Promise((resolve, reject) => {
						new jimp(outImg.bitmap.width, outImg.bitmap.height + imageSize, (err, image) => {
							if (err) {
								reject(err);
							} else {
								image.composite(outImg, 0, 0);
								image.composite(b[i], 0, outImg.bitmap.height);
								outImg = image;
								resolve(image);
							}
						});
					});
				}
			}
			let buffer = await new Promise((resolve, reject) => {
				outImg.getBuffer(jimp.AUTO, (err, res) => {
					if (err) {
						reject(err);
					} else {
						resolve(res);
					}
				});
			});
			bot.uploadFile({
				to: channelID,
				file: buffer,
				filename: code[0] + "." + imageExt
			}, () => {
				sendLongMessage(out, user, userID, channelID, message, event, embCT);
			});
		} else {
			let buffer = await downloadImage(imageUrl + code[0] + "." + imageExt, user, userID, channelID, message, event);
			if (buffer) {
				bot.uploadFile({
					to: channelID,
					file: buffer,
					filename: code[0] + "." + imageExt
				}, () => {
					sendLongMessage(out, user, userID, channelID, message, event, embCT);
				});
			} else {
				sendLongMessage(out, user, userID, channelID, message, event, embCT);
			}
		}
	} catch (e) {
		console.error(e);
	}

}

function downloadImage(imageUrl) {
	return new Promise((resolve, reject) => {
		if (debugOutput) {
			console.log("Debug Data: " + imageUrl);
			console.dir(url.parse(imageUrl));
		}
		https.get(url.parse(imageUrl), response => {
			let data = [];
			response.on("data", chunk => {
				data.push(chunk);
			}).on("end", () => {
				let buffer = Buffer.concat(data);
				if (filetype(buffer) && filetype(buffer).ext === imageExt) {
					jimp.read(buffer, (err, image) => {
						if (err) {
							reject(err);
						} else {
							image.resize(jimp.AUTO, imageSize);
							image.getBuffer(jimp.AUTO, (err, res) => {
								if (err) {
									reject(err);
								} else {
									resolve(res);
								}
							});
						}
					});
				} else {
					resolve(false);
				}
			});
		});
	});

}

//see getCardInfo for much of the functionality here
async function getSingleProp(user, userID, channelID, message, event, name, prop) {
	let input = message.slice((pre + name + " ").length);
	let args = input.split("|");
	let outLang = defaultLang;
	if (args.length > 1) {
		input = args[0];
		if (args[1] in dbs)
			outLang = args[1];
	}
	let inInt = parseInt(input);
	let code;
	if (inInt in cards[outLang]) {
		code = inInt;
	} else {
		code = nameCheck(input, outLang);
	}
	if (code && code in cards[outLang]) {
		let card = cards[outLang][code];
		let out = "";
		let alIDs;
		let alCard;
		let stat;
		switch (prop) {
		case "id":
			alIDs = [code];
			if (card.alias > 0 && cards[outLang][card.alias]) { //if the card has an alias, e.g. IS the alt art
				alCard = cards[outLang][card.alias];
				if (card.hasSameOT(alCard) && card.name === alCard.name) { //If the card with the alias is the same OT as the card with the base ID, then it's an alt art as opposed to an anime version or pre errata or something. However if the name is different it's a Fusion Sub or Harpie Lady.
					code = alCard.code;
					alIDs = [code];
					Object.values(cards[outLang]).forEach(tempCard => {
						if (tempCard.alias === code && tempCard.hasSameOT(alCard)) {
							alIDs.push(tempCard.code);
						}
					});
				}
			} else {
				Object.values(cards[outLang]).forEach(tempCard => {
					if (tempCard.alias === code && tempCard.hasSameOT(card)) {
						alIDs.push(tempCard.code);
					}
				});
			}
			out += card.name + ": " + alIDs.join("|");
			break;
		case "notext":
			out += "__**" + card.name + "**__\n";
			alIDs = [code];
			if (card.alias > 0 && cards[outLang][card.alias]) { //if the card has an alias, e.g. IS the alt art
				alCard = cards[outLang][card.alias];
				if (card.hasSameOT(alCard) && card.name === alCard.name) { //If the card with the alias is the same OT as the card with the base ID, then it's an alt art as opposed to an anime version or pre errata or something. However if the name is different it's a Fusion Sub or Harpie Lady.
					code = alCard.code;
					alIDs = [code];
					Object.values(cards[outLang]).forEach(tempCard => {
						if (tempCard.alias === code && tempCard.hasSameOT(alCard)) {
							alIDs.push(tempCard.code);
						}
					});
				}
			} else {
				Object.values(cards[outLang]).forEach(tempCard => {
					if (tempCard.alias === code && tempCard.hasSameOT(card)) {
						alIDs.push(tempCard.code);
					}
				});
			}
			out += "**ID**: " + alIDs.join("|") + "\n";
			if (card.sets) {
				out += "**Archetype**: " + card.sets.join(", ");
			}
			out += "\n";
			stat = card.ot.join("/");
			Object.keys(lflist).forEach(key => { //keys of the banlist table are card IDs, values are number of copies allowed
				if (stat.includes(key)) {
					let lim = 3;
					if (lflist[key][code] || lflist[key][code] === 0) { //0 is falsy, so we need to check it explicitly. Ugh.
						lim = lflist[key][code];
					}
					let re = new RegExp(key);
					stat = stat.replace(re, key + ": " + lim);
				}
			});
			out += "**Status**: " + stat + "\n";
			if (card.types.includes("Monster")) {
				let arrace = addEmote(card.race, "|");
				let typesStr;
				if (emoteMode < 2) {
					typesStr = card.types.join("/").replace("Monster", arrace[emoteMode]);
				} else {
					typesStr = card.types.join("/").replace("Monster", arrace[0]);
					typesStr += " " + arrace[1];
				}
				out += "**Type**: " + typesStr + " **Attribute**: " + addEmote(card.attribute, "|")[emoteMode] + "\n";
				let lvName = "Level";
				if (card.types.includes("Xyz")) {
					lvName = "Rank";
				} else if (card.types.includes("Link")) {
					lvName = "Link Rating";
				}
				out += "**" + lvName + "**: " + card.level + " ";
				if (emoteMode > 0) {
					if (card.isType(0x1000000000)) { //is dark synchro
						out += emoteDB["NLevel"] + " ";
					} else {
						out += emoteDB[lvName] + " ";
					}
				}
				out += " **ATK**: " + card.atk + " ";
				if (card.def) {
					out += "**DEF**: " + card.def;
				} else {
					out += "**Link Markers**: " + card.markers;
				}
				if (card.types.includes("Pendulum")) {
					out += " **Pendulum Scale**: ";
					if (emoteMode > 0) {
						out += " " + card.lscale + emoteDB["L.Scale"] + " " + emoteDB["R.Scale"] + card.rscale + " ";
					} else {
						out += card.lscale + "/" + card.rscale;
					}
				}
				out += "\n";
			} else if (card.types.includes("Spell") || card.types.includes("Trap")) {
				let typeemote = addEmote(card.types, "/");
				if ((typeemote[0] == "Spell" || typeemote[0] == "Trap") && emoteMode > 0) {
					typeemote[1] += emoteDB["NormalST"];
					typeemote[2] += emoteDB["NormalST"];
				}
				if (card.isType(0x100)) { //is trap monster
					let arrace = addEmote(card.race, "|");
					let typesStr;
					if (emoteMode < 2) {
						typesStr = arrace[emoteMode] + "/" + typeemote[emoteMode];
					} else {
						typesStr = arrace[0] + "/" + typeemote[0];
						typesStr += " " + arrace[1] + typeemote[1];
					}
					out += "**Type**: " + typesStr + " **Attribute**: " + addEmote(card.attribute, "|")[emoteMode] + "\n**Level**: " + card.level;
					if (emoteMode > 0) {
						out += " " + emoteDB["Level"];
					}
					out += "  **ATK**: " + card.atk + " **DEF**: " + card.def + "\n";
				} else {
					out += "**Type**: " + typeemote[emoteMode] + "\n";
				}
			}
			break;
		case "effect":
			out += "__**" + card.name + "**__\n";
			if (card.types.includes("Monster")) {
				let cardText = card.desc;
				let textName = "Monster Effect";
				if (card.types.includes("Normal")) {
					textName = "Flavour Text";
				}
				if (cardText.length === 4) {
					out += "**" + cardText[2] + "**: " + cardText[0] + "\n**" + cardText[3] + "**: " + cardText[1];
				} else {
					out += "**" + textName + "**: " + cardText[0];
				}
			} else if (card.types.includes("Spell") || card.types.includes("Trap")) {
				out += "**Effect**: " + card.desc[0].replace(/\n/g, "\n");
			} else {
				out += "**Card Text**: " + card.desc[0].replace(/\n/g, "\n");
			}
			break;
		default:
			return;
		}
		if (out.length > 0) {
			sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
		}
	} else {
		console.log("Invalid card ID or name, please try again.");
	}
}

function deck(user, userID, channelID, message, event) {
	let deckUrl = event.d.attachments && event.d.attachments[0] && event.d.attachments[0].url;
	if (!deckUrl) {
		return;
	}
	let args = message.toLowerCase().split(" ");
	let outLang = defaultLang;
	for (let arg of args) {
		if (arg in dbs) {
			outLang = arg;
		}
	}
	https.get(url.parse(deckUrl), response => {
		let data = [];
		response.on("data", chunk => {
			data.push(chunk);
		}).on("end", async () => {
			let buffer = Buffer.concat(data);
			let deckString = buffer.toString();
			let mainDeck = sliceBetween(deckString, "#main", "#extra").split("\n");
			let extraDeck = sliceBetween(deckString, "#extra", "!side").split("\n");
			let sideDeck = deckString.split("!side")[1] && deckString.split("!side")[1].split("\n");
			let mainObj = {};
			let extraObj = {};
			let sideObj = {};
			for (let card of mainDeck) {
				let car = cards[outLang][parseInt(card)];
				if (car) {
					if (mainObj[car.name])
						mainObj[car.name].count++;
					else 
						mainObj[car.name] = { name: car.name, types: car.types, count: 1};
				}
			}
			for (let card of extraDeck) {
				let car = cards[outLang][parseInt(card)];
				if (car) {
					if (extraObj[car.name])
						extraObj[car.name].count++;
					else 
						extraObj[car.name] = { name: car.name, types: car.types, count: 1};
				}
			}
			if (sideDeck) {
				for (let card of sideDeck) {
					let car = cards[outLang][parseInt(card)];
					if (car) {
						if (sideObj[car.name])
							sideObj[car.name].count++;
						else 
							sideObj[car.name] = { name: car.name, types: car.types, count: 1};
					}
				}
			}
			if (Object.keys(mainObj).length + Object.keys(extraObj).length + Object.keys(sideObj).length === 0) {
				return;
			}
			let mainMonCount = 0;
			let mainSpellCount = 0;
			let mainTrapCount = 0;
			let extraFusionCount = 0;
			let extraSynchroCount = 0;
			let extraXyzCount = 0;
			let extraLinkCount = 0;
			let mainArr = Object.values(mainObj);
			mainArr.forEach(car => {
				if (car.types.includes("Monster"))
					mainMonCount += car.count;
				if (car.types.includes("Spell"))
					mainSpellCount += car.count;
				if (car.types.includes("Trap"))
					mainTrapCount += car.count;
			});
			let extraArr = Object.values(extraObj);
			extraArr.forEach(car => {
				if (car.types.includes("Fusion"))
					extraFusionCount += car.count;
				if (car.types.includes("Synchro"))
					extraSynchroCount += car.count;
				if (car.types.includes("Xyz"))
					extraXyzCount += car.count;
				if (car.types.includes("Link"))
					extraLinkCount += car.count;
			});
			let sideArr = Object.values(sideObj);
			let out = "";
			let accu = (acc, val) => acc + val.count;
			if (mainArr.length > 0) {
				out += "**Main Deck**\n" + mainArr.reduce(accu, 0) + " cards";
				if (mainMonCount + mainSpellCount + mainTrapCount > 0) {
					out += " (";
					let tempArr = [];
					if (mainMonCount > 0)
						tempArr.push("Monsters: " + mainMonCount);
					if (mainSpellCount > 0)
						tempArr.push("Spells: " + mainSpellCount);
					if (mainTrapCount > 0)
						tempArr.push("Traps: " + mainTrapCount);
					out += tempArr.join(", ") + ")";
				}
				out += "\n";
				mainArr.forEach(car => {
					out += car.count + " " + car.name + "\n";
				});
			}
			if (extraArr.length > 0) {
				out += "**Extra Deck**\n" + extraArr.reduce(accu, 0) + " cards";
				if (extraFusionCount + extraSynchroCount + extraXyzCount + extraLinkCount > 0) {
					out += " (";
					let tempArr = [];
					if (extraFusionCount > 0)
						tempArr.push("Fusion: " + extraFusionCount);
					if (extraSynchroCount > 0)
						tempArr.push("Synchro: " + extraSynchroCount);
					if (extraXyzCount > 0)
						tempArr.push("Xyz: " + extraXyzCount);
					if (extraLinkCount > 0)
						tempArr.push("Link: " + extraLinkCount);
					out += tempArr.join(", ") + ")";
				}
				out += "\n";
				extraArr.forEach(car => {
					out += car.count + " " + car.name + "\n";
				});
			}
			if (sideArr.length > 0) {
				out += "**Side Deck**\n" + sideArr.reduce(accu, 0) + " cards\n";
				sideArr.forEach(car => {
					out += car.count + " " + car.name + "\n";
				});
			}
			if (out.length > 0) {
				let outArr = out.match(/[\s\S]{1,2000}/g); //splits text into 2k character chunks
				sendMessage(user, userID, userID, message, event, outArr[0]).then(() => {
					if (outArr[1])
						sendMessage(user, userID, userID, message, event, outArr[1]).catch(msgErrHandler);
				}).catch(msgErrHandler);
			}
		});
	});
}

function getCardScript(card) {
	return new Promise(resolve => {
		let scriptUrl = scriptUrlMaster;
		if (card.isAnime) {
			scriptUrl = scriptUrlAnime;
		}
		if (card.isCustom) {
			scriptUrl = scriptUrlCustom;
		}
		let fullUrl = scriptUrl + "c" + card.code + ".lua";
		if (debugOutput) {
			console.log("Debug data: " + fullUrl);
			console.dir(url.parse(fullUrl));
		}
		https.get(url.parse(fullUrl), response => {
			let data = [];
			response.on("data", chunk => {
				data.push(chunk);
			}).on("end", async () => {
				let buffer = Buffer.concat(data);
				let script = buffer.toString();
				if (script === "404: Not Found\n" && scriptUrlBackup) {
					script = await new Promise(resolve => {
						fullUrl = scriptUrlBackup + "c" + card.code + ".lua";
						https.get(url.parse(fullUrl), response => {
							let data2 = [];
							response.on("data", chunk => {
								data2.push(chunk);
							}).on("end", async () => {
								let buffer2 = Buffer.concat(data2);
								let script2 = buffer2.toString();
								resolve(script2);
							});
						});
					});
				}
				let scriptArr = script.split("\n");
				script = "";
				scriptArr.forEach((key, index) => {
					script += " ".repeat(scriptArr.length.toString().length - (index + 1).toString().length) + (index + 1) + "| " + scriptArr[index] + "\n"; //appends properly space-padded line numbers at start of lines
				});
				if (script.length + "```lua\n```\n".length + fullUrl.length > 2000) { //display script if it fits, otherwise just link to it
					resolve(fullUrl);
				} else {
					resolve("```lua\n" + script + "```\n" + fullUrl);
				}
			});
		});
	});
}

function matches(user, userID, channelID, message, event, name) {
	let a = message.toLowerCase().split("|");
	let arg = a[0].slice((pre + name + " ").length);
	let args = a[1] && a[1].split(" ");
	let outLang = defaultLang;
	if (args) {
		for (let ar of args) {
			if (ar in dbs) {
				outLang = ar;
			}
		}
	}
	if (shortcuts.length > 0) {
		let lineArr = arg.split(" ");
		for (let i = 0; i < lineArr.length; i++) {
			for (let cut of shortcuts) {
				for (let j = 0; j < cut.length - 1; j++) {
					if (lineArr[i].toLowerCase() === cut[j].toLowerCase()) {
						lineArr[i] = cut[cut.length - 1];
					}
				}
			}
		}
		arg = lineArr.join(" ");
	}
	let results = fuse[outLang].search(arg);
	if (results.length < 1) {
		sendMessage(user, userID, channelID, message, event, "No matches found!").catch(msgErrHandler);
	} else {
		let argObj;
		if (args) {
			argObj = parseFilterArgs(a[1]);
		}
		let out = "Top 10 card name matches for **`" + arg + "`**:";
		let i = 0;
		let outs = [];
		while (results[i] && outs.length < 10) {
			let card = cards[outLang][results[i].item.id];
			if (card) {
				if (aliasCheck(card, outLang) && (!argObj || randFilterCheck(results[i].item.id, argObj, outLang))) {
					outs.push("\n" + (outs.length + 1) + ". " + results[i].item.name);
				}
			}
			i++;
		}
		for (let o of outs) {
			out += o;
		}
		sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
	}
}

function set(user, userID, channelID, message, event, name) {
	let arg = message.slice((pre + name + " ").length);
	if (arg.toLowerCase() in setcodes) {
		sendMessage(user, userID, channelID, message, event, setcodes[arg.toLowerCase()] + ": " + arg).catch(msgErrHandler);
	} else {
		Object.keys(setcodes).forEach(key => {
			if (setcodes[key].toLowerCase() === arg.toLowerCase()) {
				sendMessage(user, userID, channelID, message, event, setcodes[key] + ": " + key).catch(msgErrHandler);
				return;
			}
		});
	}
}

function searchSkill(user, userID, channelID, message, event, name) {
	let arg = message.toLowerCase().slice((pre + name + " ").length);
	let index = -1;
	skills.forEach((skill, ind) => {
		if (arg === skill.name.toLowerCase()) {
			index = ind;
		}
	});
	if (index < 0) {
		let result = skillFuse.search(arg);
		if (result.length > 0) {
			skills.forEach((skill, ind) => {
				if (result[0].item.name.toLowerCase() === skill.name.toLowerCase()) {
					index = ind;
				}
			});
		}
	}
	if (index > -1) {
		let skill = skills[index];
		let out = "";
		out += "__**" + skill.name + "**__\n**Effect**: " + skill.desc + "\n**Characters**: " + skill.chars;
		sendLongMessage(out, user, userID, channelID, message, event);
	} else {
		console.log("No skill found for search '" + arg + "'!");
	}
}

function strings(user, userID, channelID, message, event, name) {
	let input = message.slice((pre + name + " ").length);
	let args = input.split("|");
	let inLang = defaultLang;
	if (args.length > 1) {
		input = args[0];
		if (args[1] in dbs)
			inLang = args[1];
	}
	let inInt = parseInt(input);
	let code;
	if (inInt in cards[inLang]) {
		code = inInt;
	} else {
		code = nameCheck(input, inLang);
	}
	if (code && code in cards[inLang]) {
		let card = cards[inLang][code];
		if (card.alias > 0) {
			card = cards[inLang][card.alias];
		}
		let strs = card.strings;
		if (strs && Object.keys(strs).length > 0) {
			let out = "__**" + card.name + "**__\n";
			Object.keys(strs).forEach(key => {
				out += key + ": `" + strs[key] + "`\n";
			});
			sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
		} else {
			let out = "No strings found for " + card.name + "!";
			sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
		}
	}
}

async function rulings(user, userID, channelID, message, event, name) {
	let input = message.slice((pre + name + " ").length);
	let args = input.split("|");
	let inLang = defaultLang;
	if (args.length > 1) {
		input = args[0];
		if (args[1] in dbs)
			inLang = args[1];
	}
	let inInt = parseInt(input);
	let code;
	if (inInt in cards[inLang]) {
		code = inInt;
	} else {
		code = nameCheck(input, inLang);
	}
	if (!(code && code in cards[inLang]))
		return;
	let enCard = cards[inLang][code];
	let enName = enCard.name;
	let out = "Rulings for `" + enName + "`: ";
	let jUrl;
	await getDBID(enName).then(id => {
		jUrl = "https://www.db.yugioh-card.com/yugiohdb/faq_search.action?ope=4&cid=" + id + "&request_locale=ja";
		out += "<" + encodeURI(jUrl) + ">";
	}).catch(e => {
		if (rulingLang) {
			let jaCard;
			Object.values(cards[rulingLang]).forEach(tempCard => {
				if (tempCard.code === code) {
					jaCard = tempCard;
				}
			});
			if (!jaCard) {
				out = "Sorry, I don't have a Japanese translation of \"" + enName + "\"!";
			} else {
				let jaName = jaCard.name;
				let jUrl = "https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=1&sess=1&keyword=" + jaName + "&stype=1&ctype=&starfr=&starto=&pscalefr=&pscaleto=&linkmarkerfr=&linkmarkerto=&atkfr=&atkto=&deffr=&defto=&othercon=2&request_locale=ja";
				out =+ "<" + encodeURI(jUrl) + ">\nClick the appropriate search result, then the yellow button that reads \"このカードのＱ＆Ａを表示\"";
			}
		} else {
			out = e;
		}
	});
	sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
}

function rankings(user, userID, channelID, message, event) {
	let args = message.split(" ");
	let term = "cards";
	let validTerms = ["cards", "inputs", "commands"];
	let numToGet = -1;
	let outLang = defaultLang;
	for (let arg of args) {
		if (parseInt(arg) > numToGet) {
			numToGet = parseInt(arg);
		}
		if (validTerms.includes(arg.toLowerCase())) {
			term = arg.toLowerCase();
		}
		if (arg in dbs) {
			outLang = arg;
		}
	}
	if (numToGet === -1) {
		numToGet = 10;
	}
	let statsKey;
	let outStr;
	switch (term) {
	case "inputs":
		statsKey = "inputRankings";
		outStr = "most common search inputs";
		break;
	case "commands":
		statsKey = "cmdRankings";
		outStr = "most popular commands";
		break;
	case "cards":
	default:
		statsKey = "searchRankings";
		outStr = "most searched cards";
	}
	let tempRanks = JSON.parse(JSON.stringify(stats[statsKey])); //this creates a copy of the current state of the rankings - we'll be removing elements as we go, we don't want to mess up the rankings
	let results = [];
	let ranks = [];
	let i = 1;
	let out = "__**" + numToGet + " " + outStr + "**__\n";
	while (i <= numToGet && Object.keys(tempRanks).length > 0) { //keeps going until we have equal or more results (ties will push multiple results at once and put us over) or we're out of rankings
		let keys = Object.keys(tempRanks);
		let largest = Math.max.apply(null, keys.map(x => tempRanks[x])); //gets the highest value in the object
		let result = keys.reduce((result, key) => {
			if (tempRanks[key] === largest) {
				result.push(key);
			}
			return result;
		}, []);
		for (let r of result) {
			results.push(r);
			ranks.push(i);
			delete tempRanks[r];
		}
		i++;
	}
	if (results.length > 0) {
		results.forEach((value, index) => {
			let tempOut;
			let tempVal;
			let card;
			let title;
			switch (term) {
			case "terms":
				tempOut = ranks[index] + ". `" + value + "` (" + stats[statsKey][value] + " times)\n";
				if (out.length + tempOut.length < 2000) {
					out += tempOut;
				}
				break;
			case "commands":
				tempVal = value;
				if (tempVal.indexOf("search") < 0) {
					tempVal = "`" + pre + tempVal + "`";
				}
				tempOut = ranks[index] + ". " + tempVal + " (" + stats[statsKey][value] + " times)\n";
				if (out.length + tempOut.length < 2000) {
					out += tempOut;
				}
				break;
			case "cards":
			default:
				card = cards[outLang][parseInt(value)];
				title = card && card.name || value;
				tempOut = ranks[index] + ". " + title + " (" + stats[statsKey][value] + " times)\n";
				if (out.length + tempOut.length < 2000) {
					out += tempOut;
				}
			}
		});
		sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
	}
}

function banlist(user, userID, channelID, message, event, name) {
	let input = message.slice((pre + name + " ").length);
	for (let list of Object.keys(lflist)) {
		if (input.toLowerCase() === list.toLowerCase()) {
			let ban = lflist[list];
			let out = "__**" + list + " banlist: **__\n";
			let banArr = [];
			let limArr = [];
			let semArr = [];
			Object.keys(ban).forEach(card => {
				switch(parseInt(ban[card])) {
				case 0: banArr.push(card); break;
				case 1: limArr.push(card); break;
				case 2: semArr.push(card); break;
				}
			});
			if (banArr.length > 0) {
				out += "**Forbidden**\n";
				for (let code of banArr) {
					let card = cards[defaultLang][parseInt(code)];
					if (card)
						out += card.name + "\n";
					else
						out += code + "\n";
				}
			}
			if (limArr.length > 0) {
				out += "**Limited**\n";
				for (let code of limArr) {
					let card = cards[defaultLang][parseInt(code)];
					if (card)
						out += card.name + "\n";
					else
						out += code + "\n";
				}
			}
			if (semArr.length > 0) {
				out += "**Semi-Limited**\n";
				for (let code of semArr) {
					let card = cards[defaultLang][parseInt(code)];
					if (card)
						out += card.name + "\n";
					else
						out += code + "\n";
				}
			}
			if (out.length > 0) {
				let outArr = out.match(/[\s\S]{1,2000}/g); //splits text into 2k character chunks
				for (let msg of outArr) {
					sendMessage(user, userID, userID, message, event, msg).catch(msgErrHandler);
				}
			}
			return;
		}
	}
	sendMessage(user, userID, channelID, message, event, "Sorry, I couldn't find a banlist named `" + input + "`!").catch(msgErrHandler);
}

function banlink(user, userID, channelID, message, event, name) {
	let input = message.slice((pre + name + " ").length);
	let out;
	switch (input.toLowerCase()) {
	case "tcg": out = "http://www.yugioh-card.com/en/limited/"; break;
	case "ocg": out = "http://www.yugioh-card.com/my/event/rules_guides/forbidden_cardlist.php?list=201801&lang=en"; break;
	}
	if (out)
		sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
}

function yugi(user, userID, channelID, message, event, name) {
	let input = message.slice((pre + name + " ").length);
	request("https://yugipedia.com/api.php?action=opensearch&results=2&redirects=resolve&format=json&search=" + input, (error, response, body) => {
		let out;
		let data;
		if (body)
			data = JSON.parse(body);
		if (!error && response.statusCode && response.statusCode === 200 && data) {
			if (data[3].length > 0) {
				out = data[3][0];
			} else {
				out = "Sorry, no page was found for `" + input + "`!";
			}
		} else if (error) {
			console.error(error);
			out = "Sorry, there was an error searching Yugipedia.";
		}
		sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
	});
}

//utility functions
function sendLongMessage(out, user, userID, channelID, message, event, typecolor, code, outLang) { //called by most cases of replying with a message to split up card text if too long, thanks ra anime
	return new Promise((resolve, reject) => {
		try {
			let tempcolor = embcDB && typecolor && embcDB[typecolor] || embedColor;
			let imgurl = "";
			if (code && outLang) {
				imgurl = imageUrlMaster;
				let card = cards[outLang][code];
				if (card.isAnime) {
					imgurl = imageUrlAnime;
				}
				if (card.isCustom) {
					imgurl = imageUrlCustom;
				}
				imgurl += code + "." + imageExt;
			}
			if (out.length > 2000) {
				let outArr = [out.slice(0, 2000 - 5 - longStr.length) + longStr, out.slice(2000 - 5 - longStr.length)];
				longMsg = outArr[1];
				if (messageMode > 0) {
					bot.sendMessage({
						to: channelID,
						embed: {
							color: tempcolor,
							description: outArr[0],
							thumbnail: {
								url: imgurl
							},
						}
					}, (err, res) => {
						if (err) {
							if (err.response && err.response.retry_after) {
								setTimeout(() => {
									sendLongMessage(out, user, userID, channelID, message, event, typecolor, code, outLang);
								}, err.response.retry_after + 1);
							} else {
								reject(err);
							}
						} else {
							resolve(res);
						}
					});
				} else {
					bot.sendMessage({
						to: channelID,
						message: outArr[0]
					}, (err, res) => {
						if (err) {
							if (err.response && err.response.retry_after) {
								setTimeout(() => {
									sendLongMessage(out, user, userID, channelID, message, event, typecolor, code, outLang);
								}, err.response.retry_after + 1);
							} else {
								reject(err);
							}
						} else {
							resolve(res);
						}
					});
				}
			} else {
				if (messageMode > 0) {
					bot.sendMessage({
						to: channelID,
						embed: {
							color: tempcolor,
							description: out,
							thumbnail: {
								url: imgurl
							},
						}
					}, (err, res) => {
						if (err) {
							if (err.response && err.response.retry_after) {
								setTimeout(() => {
									sendLongMessage(out, user, userID, channelID, message, event, typecolor, code, outLang);
								}, err.response.retry_after + 1);
							} else {
								reject(err);
							}
						} else {
							resolve(res);
						}
					});
				} else {
					bot.sendMessage({
						to: channelID,
						message: out
					}, (err, res) => {
						if (err) {
							if (err.response && err.response.retry_after) {
								setTimeout(() => {
									sendLongMessage(out, user, userID, channelID, message, event, typecolor, code, outLang);
								}, err.response.retry_after + 1);
							} else {
								reject(err);
							}
						} else {
							resolve(res);
						}
					});
				}
			}
		} catch (e) {
			reject(e);
		}
	});
}

function compareFuseObj(a, b) { //called in card searching by name to resort the array of objects after its scores are weighted by hand
	if (a.score < b.score) {
		return -1;
	}
	if (a.score > b.score) {
		return 1;
	}
	return 0;
}

function getEmbCT(card) {
	let ct = null;
	for (let type of card.types) {
		if (["Spell", "Trap", "Fusion", "Synchro", "Token", "Xyz", "Link"].includes(type)) {
			ct = type;
		}
		if (!ct && ["Ritual", "Normal", "Effect"].includes(type)) { //ritual is in the delayed portion so that if it's a Ritual Spell, the ct will be Spell, and not Ritual.
			ct = type;
		}
	}
	if (card.isType(0x1000000000)) {
		ct = "Dark Synchro";
	}
	return ct;
}

function nameCheck(line, inLang) { //called by card searching functions to determine if fuse is needed and if so use it
	if (!(inLang in dbs)) {
		inLang = defaultLang;
	}
	for (let tempCard of Object.values(cards[inLang])) { //check all entries for exact name
		if (tempCard.name.toLowerCase() === line.toLowerCase()) {
			return tempCard.code;
		}
	}
	if (line.length === 1) //if no exact match, kill short searches
		return -1;
	if (shortcuts.length > 0) {
		let lineArr = line.split(" ");
		for (let i = 0; i < lineArr.length; i++) {
			for (let cut of shortcuts) {
				for (let j = 0; j < cut.length - 1; j++) {
					if (lineArr[i].toLowerCase() === cut[j].toLowerCase()) {
						lineArr[i] = cut[cut.length - 1];
					}
				}
			}
		}
		line = lineArr.join(" ");
		for (let tempCard of Object.values(cards[inLang])) { //check all entries for exact name
			if (tempCard.name.toLowerCase() === line.toLowerCase()) {
				return tempCard.code;
			}
		}
	}
	let result = fuse[inLang].search(line);
	if (result.length < 1) {
		return -1;
	} else {
		for (let res of result) {
			let card = cards[inLang][res.item.id];
			if (card.isAnime) {
				res.score = res.score * 1.2; //weights score by status. Lower is better so increasing it makes official take priority.
			} else if (card.isCustom) {
				res.score = res.score * 1.4;
			}
		}
		result.sort(compareFuseObj);
		for (let tempCard of Object.values(cards[inLang])) { //check all entries for exact name
			if (tempCard.name.toLowerCase() === result[0].item.name.toLowerCase()) {
				return tempCard.code;
			}
		}
		return -1;
	}
}

function addEmote(args, symbol) {
	let str = args.join(symbol);
	let emotes = "";
	if (emoteMode > 0) {
		for (let i = 0; i < args.length; i++) {
			emotes += emoteDB[args[i]];
		}
	}
	return [str, emotes, str + " " + emotes];
}

function parseFilterArgs(input) {
	if (Array.isArray(input)) {
		input = input.join(" ");
	}
	input = input.toLowerCase();
	let output = {};
	let validFilters = {
		"status": {
			name: "ot",
			func: arg => Card.otList.includes(arg)
		},
		"ot": {
			name: "ot",
			func: arg => Card.otList.includes(arg)
		},
		"type": {
			name: "type",
			func: arg => Card.typeList.includes(arg)
		},
		"race": {
			name: "race",
			func: arg => Card.raceList.includes(arg)
		},
		"mtype": {
			name: "race",
			func: arg => Card.raceList.includes(arg)
		},
		"attribute": {
			name: "att",
			func: arg => Card.attributeList.includes(arg)
		},
		"att": {
			name: "att",
			func: arg => Card.attributeList.includes(arg)
		},
		"archetype": {
			name: "set",
			func: arg => Card.setList.includes(arg)
		},
		"set": {
			name: "set",
			func: arg => Card.setList.includes(arg)
		},
		"atk": {
			name: "atk",
			func: arg => !isNaN(parseInt(arg)) || arg === "?"
		},
		"def": {
			name: "def",
			func: arg => !isNaN(parseInt(arg)) || arg === "?"
		},
		"level": {
			name: "level",
			func: arg => !isNaN(parseInt(arg)),
			convert: arg => parseInt(arg)
		},
		"lscale": {
			name: "lscale",
			func: arg => !isNaN(parseInt(arg)),
			convert: arg => parseInt(arg)
		},
		"rscale": {
			name: "lscale",
			func: arg => !isNaN(parseInt(arg)),
			convert: arg => parseInt(arg)
		},
		"scale": {
			name: "scale",
			func: arg => !isNaN(parseInt(arg)),
			convert: arg => parseInt(arg)
		}
	};
	let terms = [];
	while (input.includes(":")) {
		let colonIndex = input.indexOf(":");
		let startIndex = getLastIndexBefore(input, " ", colonIndex);
		let nextColonIndex = getIndexAfter(input, ":", colonIndex);
		let endIndex;
		if (nextColonIndex < 0) {
			nextColonIndex = input.length;
			endIndex = input.length;
		} else {
			endIndex = getLastIndexBefore(input, " ", nextColonIndex);
			if (endIndex < 0 || endIndex === startIndex) {
				endIndex = input.length;
			}
		}
		terms.push(input.slice(startIndex + 1, endIndex));
		if (startIndex < 0)
			startIndex = 0;
		input = input.slice(0, startIndex) + input.slice(endIndex);
	}
	for (let term of terms) {
		let arr = term.split(":");
		let name = arr[0];
		let args = arr[1];
		if (name in validFilters) {
			name = validFilters[name].name;
		} else {
			continue;
		}
		let outArr = [];
		let ors = args.split("/");
		for (let arg of ors) {
			let tempArr = [];
			for (let plus of arg.split("+")) {
				if (validFilters[name].func(plus)) {
					if (validFilters[name].convert) {
						tempArr.push(validFilters[name].convert(plus));
					} else {
						tempArr.push(plus);
					}
				}
			}
			if (tempArr.length > 0)
				outArr.push(tempArr);
		}
		if (outArr.length > 0)
			output[name] = outArr;
	}
	return output;
}

function randFilterCheck(code, args, outLang) {
	if (Object.keys(args).length === 0)
		return true;
	let boo = true;
	let card = cards[outLang][code];
	for (let key of Object.keys(args)) {
		let subBoo;
		switch (key) {
		case "ot":
			subBoo = false;
			for (let either of args[key]) {
				let subSubBoo = true;
				let tempOTs = [];
				for (let stat of card.ot)
					tempOTs.push(stat.toLowerCase());
				for (let also of either) {
					if (tempOTs.indexOf(also) < 0)
						subSubBoo = false;
				}
				subBoo = subBoo || subSubBoo;
			}
			break;
		case "type":
			subBoo = false;
			for (let either of args[key]) {
				let subSubBoo = true;
				let tempTypes = [];
				for (let type of card.allTypes)
					tempTypes.push(type.toLowerCase());
				for (let also of either) {
					if (tempTypes.indexOf(also) < 0)
						subSubBoo = false;
				}
				subBoo = subBoo || subSubBoo;
			}
			break;
		case "race":
			subBoo = false;
			for (let either of args[key]) {
				let subSubBoo = true;
				let tempRaces = [];
				for (let race of card.race)
					tempRaces.push(race.toLowerCase());
				for (let also of either) {
					if (tempRaces.indexOf(also) < 0)
						subSubBoo = false;
				}
				subBoo = subBoo || subSubBoo;
			}
			break;
		case "att":
			subBoo = false;
			for (let either of args[key]) {
				let subSubBoo = true;
				let tempAtts = [];
				for (let att of card.attribute)
					tempAtts.push(att.toLowerCase());
				for (let also of either) {
					if (tempAtts.indexOf(also) < 0)
						subSubBoo = false;
				}
				subBoo = subBoo || subSubBoo;
			}
			break;
		case "set":
			subBoo = false;
			for (let either of args[key]) {
				let subSubBoo = true;
				let tempSets = [];
				if (card.sets) {
					for (let set of card.sets)
						tempSets.push(set.toLowerCase());
				}
				for (let also of either) {
					if (tempSets.indexOf(also) < 0)
						subSubBoo = false;
				}
				subBoo = subBoo || subSubBoo;
			}
			break;
		case "level":
			subBoo = false;
			for (let either of args[key]) {
				if (card.level === either[0])
					subBoo = true;
			}
			break;
		case "lscale":
			subBoo = false;
			for (let either of args[key]) {
				if (card.lscale === either[0])
					subBoo = true;
			}
			break;
		case "rscale":
			subBoo = false;
			for (let either of args[key]) {
				if (card.rscale === either[0])
					subBoo = true;
			}
			break;
		case "scale":
			subBoo = false;
			for (let either of args[key]) {
				if (card.lscale === either[0] || card.rscale === either[0])
					subBoo = true;
			}
			break;
		case "atk":
			subBoo = false;
			for (let either of args[key]) {
				if (card.atk === either[0])
					subBoo = true;
			}
			break;
		case "def":
			subBoo = false;
			for (let either of args[key]) {
				if (card.def === either[0])
					subBoo = true;
			}
			break;
		}
		boo = boo && subBoo;
		if (!boo)
			return boo;
	}
	return boo;
}

function aliasCheck(card, outLang) { //called when getting alt arts, checks if an aliased card has the same OT as the original
	let alias = card.alias;
	if (alias === 0) {
		return true;
	}
	let alCard = cards[outLang][alias];
	return alCard && !card.hasSameOT(alCard);
}

function getBaseID(card, inLang) {
	let alias = card.alias;
	let alCode = card.code;
	if (alias === 0) {
		return alCode;
	}
	let baseCard = cards[inLang][alias];
	if (card.hasSameOT(baseCard) && card.name == baseCard.name) {
		return baseCard.code;
	} else {
		return alCode;
	}
}

function getGHContents(lang, owner, repo, path) {
	return new Promise((resolve, reject) => {
		console.log("Reading repo " + owner + "/" + repo + ".");
		if (!path)
			path = "";
		github.repos.getContent({
			owner: owner,
			repo: repo,
			path: path
		}, (err, res) => {
			if (err) {
				reject(err);
			} else {
				let filenames = [];
				let promises = [];
				for (let file of Object.values(res.data)) {
					if (file.name.endsWith(".cdb")) {
						console.log("Downloading " + file.name + ".");
						try {
							let prom = downloadDB(file, lang);
							promises.push(prom);
							filenames.push(file.name);
						} catch (e) {
							reject(e);
						}
					}
				}
				Promise.all(promises).then(() => {
					resolve(filenames);
				});
			}
		});
	});
}

function downloadDB(file, lang) {
	return new Promise(resolve => {
		https.get(url.parse(file.download_url), response => {
			let data = [];
			response.on("data", chunk => {
				data.push(chunk);
			}).on("end", () => {
				let buffer = Buffer.concat(data);
				if (!fs.existsSync("dbs/" + lang))
					fs.mkdirSync("dbs/" + lang);
				fs.writeFileSync("dbs/" + lang + "/" + file.name, buffer, null);
				resolve(file.name);
			});
		});
	});
}

function getDBID(name) {
	return new Promise((resolve,reject) => {
		request("https://yugipedia.com/api.php?action=query&redirects=true&prop=revisions&rvprop=content&format=json&formatversion=2&titles=" + name, (error, response, body) => {
			let data;
			if (body)
				data = JSON.parse(body);
			if (!error && response.statusCode && response.statusCode === 200 && data && data.query && !data.query.pages[0].missing) {
				let re = /database_id\s+= (\d+)/;
				let match = re.exec(data.query.pages[0].revisions[0].content);
				match = match && match[1];
				if (match) {
					resolve(match);
				} else {
					reject("Card page for " + name + " does not contain a database ID.");
				}
			} else if(error) {
				reject(error);
			} else {
				reject("Card page for " + name + " does not exist");
			}
		});
	});
}

function sendMessage(user, userID, channelID, message, event, out, embColour) {
	return new Promise((resolve, reject) => {
		if (!embColour)
			embColour = embedColor;
		if (messageMode > 0) {
			bot.sendMessage({
				to: channelID,
				embed: {
					color: embColour,
					description: out
				}
			}, (err, res) => {
				if (err) {
					if (err.response && err.response.retry_after) {
						setTimeout(() => {
							sendMessage(user, userID, channelID, message, event, out, embColour).catch(msgErrHandler);
						}, err.response.retry_after + 1);
					} else {
						reject(err);
					}
				} else {
					resolve(res);
				}
			});
		} else {
			bot.sendMessage({
				to: channelID,
				message: out
			}, (err, res) => {
				if (err) {
					if (err.response && err.response.retry_after) {
						setTimeout(() => {
							sendMessage(user, userID, channelID, message, event, out, embColour).catch(msgErrHandler);
						}, err.response.retry_after + 1);
					} else {
						reject(err);
					}
				} else {
					resolve(res);
				}
			});
		}
	});
}

function msgErrHandler(e) {
	console.error(e);
}

function validateReg(regx) { //ignores <@mentions>, <#channels>, <http://escaped.links>, <:customEmoji:126243>, <a:animatedEmoji:12164>, and messages that are too long
	return regx.length > 0 && regx.indexOf(":") !== 0 && regx.indexOf("a:") !== 0 && regx.indexOf("@") !== 0 && regx.indexOf("#") !== 0 && !regx.includes("http") && regx.length <= options.maxPatternLength;
}

function sliceBetween(str, cha1, cha2) {
	return str.slice(str.indexOf(cha1) + cha1.length, str.indexOf(cha2));
}

function getIncInt(min, max) { //get random inclusive integer
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

function getLastIndexBefore(str, cha, ind) {
	let tmpStr = str.slice(0, ind);
	return tmpStr.lastIndexOf(cha);
}

function getIndexAfter(str, cha, ind) {
	let tmpStr = str.slice(ind + 1);
	let offset = str.length - tmpStr.length;
	let i = tmpStr.indexOf(cha);
	if (i > 0) {
		return i + offset;
	}
	return i;
}

//games
function trivia(user, userID, channelID, message, event) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	if (channelID in gameData || (triviaLocks[serverID] && triviaLocks[serverID].indexOf(channelID) === -1)) {
		return;
	} else {
		let outLang = defaultLang;
		let round = 1;
		let args = message.toLowerCase().split(" ");
		for (let arg of args) {
			if (arg in dbs)
				outLang = arg;
			if (parseInt(arg) > round) {
				if (parseInt(arg) > triviaMaxRounds) {
					round = triviaMaxRounds;
				} else {
					round = parseInt(arg);
				}
			}
		}
		let hard = (args.includes("hard"));
		let argObj = parseFilterArgs(message.toLowerCase());
		startTriviaRound(round, hard, outLang, argObj, user, userID, channelID, message, event);
	}
}

async function startTriviaRound(round, hard, outLang, argObj, user, userID, channelID, message, event) {
	try {
		//pick a random card
		let code;
		let buffer;
		let name;
		let card;
		let ids = Object.keys(cards[outLang]);
		let matches = [];
		if (Object.keys(argObj).length === 0) {
			argObj = {
				ot: [
					["tcg", "ocg"]
				]
			};
		}
		if (Object.keys(argObj).length > 0) {
			for (let id of ids) { //gets a list of all cards that meet specified critera, before getting a random one of those cards
				if (randFilterCheck(id, argObj, outLang) && cards[outLang][id].name.indexOf("(Anime)") === -1) { //a number of filters can be specified in the command, and this checks that a card meets them
					matches.push(id);
				}
			}
			if (matches.length === 0) {
				return;
			}
		} else {
			matches = ids;
		}
		do {
			code = matches[Math.floor(Math.random() * matches.length)];
			card = cards[outLang][code];
			name = card.name;
			let imageUrl = imageUrlMaster;
			if (card.isAnime) {
				imageUrl = imageUrlAnime;
			}
			if (card.isCustom) {
				imageUrl = imageUrlCustom;
			}
			buffer = await new Promise(resolve => {
				if (debugOutput) {
					console.log("Debug Data: " + imageUrl + code + "." + imageExt);
					console.dir(url.parse(imageUrl + code + "." + imageExt));
				}
				https.get(url.parse(imageUrl + code + "." + imageExt), response => {
					let data = [];
					response.on("data", chunk => {
						data.push(chunk);
					}).on("end", async () => {
						resolve(Buffer.concat(data));
					});
				});
			});
		} while (!(filetype(buffer) && filetype(buffer).ext === imageExt));
		let hintIs = [];
		let times = getIncInt(Math.ceil(name.length / 4), Math.floor(name.length / 2));
		let nameArr = name.split("");
		for (let i = 0; i < times; i++) {
			let ind;
			do {
				ind = getIncInt(0, name.length - 1);
			} while (hintIs.includes(ind) && nameArr[ind] !== " ");
			hintIs.push(ind);
		}
		let hint = "";
		nameArr.forEach((key, index) => {
			let letter = nameArr[index];
			if (hintIs.indexOf(index) === -1 && letter !== " ") {
				letter = "_";
			}
			hint += letter + " ";
		});
		if (channelID in gameData) {
			//start game
			gameData[channelID].name = name;
			gameData[channelID].hint = hint;
			gameData[channelID].round = round;
			gameData[channelID].lock = false;
			gameData[channelID].attempted = false;
		} else {
			//start game
			gameData[channelID] = {
				"game": "trivia",
				"name": name,
				"hint": hint,
				"round": round,
				"score": {},
				"hard": hard,
				"lang": outLang,
				"lock": false,
				"argObj": argObj,
				"attempted": false,
				"noAttCount": 0
			};
		}
		if (hard) {
			buffer = await hardCrop(buffer, user, userID, channelID, message, event);
		}
		bot.uploadFile({
			to: channelID,
			file: buffer,
			filename: code + "." + imageExt
		}, err => {
			if (err) {
				console.error(err);
			} else {
				if (!gameData[channelID])
					return;
				sendMessage(user, userID, channelID, message, event, "Can you name this card? Time remaining: `" + triviaTimeLimit / 1000 + "`", 0x00ff00).catch(msgErrHandler).then(res => {
					let messageID = res.id;
					let i = triviaTimeLimit / 1000 - 1;
					gameData[channelID].IN = setInterval(() => {
						let green = Math.floor(0xff * (i * 1000 / triviaTimeLimit)).toString("16").padStart(2, "0").replace(/0x/, "");
						let red = Math.floor(0xff * (1 - (i * 1000 / triviaTimeLimit))).toString("16").padStart(2, "0").replace(/0x/, "");
						let tempcolor = parseInt("0x" + red + green + "00");
						if (messageMode > 0) {
							bot.editMessage({
								channelID: channelID,
								messageID: messageID,
								embed: {
									color: tempcolor,
									description: "Can you name this card? Time remaining: `" + i + "`",
								}
							});
							tempcolor += 0x300 - 0x1000;
						} else {
							bot.editMessage({
								channelID: channelID,
								messageID: messageID,
								message: "Can you name this card? Time remaining: `" + i + "`"
							});
						}
						i--;
					}, 1000);
				});
				gameData[channelID].TO1 = setTimeout(() => {
					sendMessage(user, userID, channelID, message, event, "Have a hint: `" + gameData[channelID].hint + "`").catch(msgErrHandler);
				}, triviaHintTime);
				let out = "Time's up! The card was **" + gameData[channelID].name + "**!\n";
				if (Object.keys(gameData[channelID].score).length > 0) {
					out += "**Scores**:\n";
					Object.keys(gameData[channelID].score).forEach(id => {
						out += bot.users[id].username + ": " + gameData[channelID].score[id] + "\n";
					});
				}
				gameData[channelID].TO2 = setTimeout(() => {
					if (gameData[channelID].lock)
						return;
					if (gameData[channelID].attempted)
						gameData[channelID].noAttCount = 0;
					else
						gameData[channelID].noAttCount++;
					if (gameData[channelID].IN)
						clearInterval(gameData[channelID].IN);
					if (gameData[channelID].noAttCount >= 3) {
						out += "No attempt was made for 3 rounds! The game is over.";
						sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
						delete gameData[channelID];
					} else {
						gameData[channelID].lock = true;
						sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
						startTriviaRound(gameData[channelID].round, gameData[channelID].hard, gameData[channelID].lang, gameData[channelID].argObj, user, userID, channelID, message, event);
					}
				}, triviaTimeLimit);
			}
		});
	} catch (e) {
		console.error(e);
	}
}

function hardCrop(buffer) {
	return new Promise((resolve, reject) => {
		jimp.read(buffer, (err, image) => {
			if (err) {
				reject(err);
			} else {
				let x;
				let y;
				let w = image.bitmap.width / 2;
				let h = image.bitmap.height / 2;
				switch (getIncInt(0, 3)) {
				case 0:
					x = 0;
					y = 0;
					break;
				case 1:
					x = w;
					y = 0;
					break;
				case 2:
					x = 0;
					y = h;
					break;
				default:
					x = w;
					y = h;
				}
				image.crop(x, y, w, h);
				image.getBuffer(jimp.AUTO, (err, res) => {
					if (err) {
						reject(err);
					} else {
						resolve(res);
					}
				});
			}
		});
	});
}

async function answerTrivia(user, userID, channelID, message, event) {
	if (!(channelID in gameData) || gameData[channelID].game !== "trivia" || gameData[channelID].lock) {
		return;
	}
	let out;
	if (!message.toLowerCase().startsWith(pre + "tq") && !message.toLowerCase().startsWith(pre + "tskip") && !message.toLowerCase().includes(gameData[channelID].name.toLowerCase())) {
		gameData[channelID].attempted = true;
		if (thumbsdown) {
			bot.addReaction({
				channelID: channelID,
				messageID: event.d.id,
				reaction: thumbsdown
			});
		}
		return;
	}
	gameData[channelID].lock = true;
	if (gameData[channelID].TO1) {
		clearTimeout(gameData[channelID].TO1);
	}
	if (gameData[channelID].TO2) {
		clearTimeout(gameData[channelID].TO2);
	}
	if (gameData[channelID].IN) {
		clearInterval(gameData[channelID].IN);
	}
	if (message.toLowerCase().startsWith(pre + "tq")) {
		out = "<@" + userID + "> quit the game. The answer was **" + gameData[channelID].name + "**!\n";
		out = triviaScore(out, user, userID, channelID, message, event);
		out = triviaWinners(out, user, userID, channelID, message, event);
		sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
		delete gameData[channelID];
	} else if (message.toLowerCase().startsWith(pre + "tskip")) {
		gameData[channelID].noAttCount = 0;
		out = "<@" + userID + "> skipped the round! The answer was **" + gameData[channelID].name + "**!\n";
		out = triviaScore(out, user, userID, channelID, message, event);
		sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
		startTriviaRound(gameData[channelID].round, gameData[channelID].hard, gameData[channelID].lang, gameData[channelID].argObj, user, userID, channelID, message, event);
	} else if (message.toLowerCase().includes(gameData[channelID].name.toLowerCase())) {
		gameData[channelID].noAttCount = 0;
		bot.addReaction({
			channelID: channelID,
			messageID: event.d.id,
			reaction: thumbsup
		});
		out = "<@" + userID + "> got it! The answer was **" + gameData[channelID].name + "**!\n";
		if (gameData[channelID].score[userID]) {
			gameData[channelID].score[userID]++;
		} else {
			gameData[channelID].score[userID] = 1;
		}
		out = triviaScore(out, user, userID, channelID, message, event);
		if (gameData[channelID].round === 1) {
			out += "The game is over! ";
			out = triviaWinners(out, user, userID, channelID, message, event);
			sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
			delete gameData[channelID];
		} else {
			sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
			startTriviaRound(gameData[channelID].round - 1, gameData[channelID].hard, gameData[channelID].lang, gameData[channelID].argObj, user, userID, channelID, message, event);
		}
	}
}

function triviaScore(out, user, userID, channelID) {
	if (Object.keys(gameData[channelID].score).length > 0) {
		out += "\n**Scores**:\n";
		Object.keys(gameData[channelID].score).forEach(id => {
			out += bot.users[id].username + ": " + gameData[channelID].score[id] + "\n";
		});
	}
	return out;
}

function triviaWinners(out, user, userID, channelID) {
	if (Object.keys(gameData[channelID].score).length > 0) {
		let winners = [];
		Object.keys(gameData[channelID].score).forEach((id, index) => {
			if (index === 0 || gameData[channelID].score[id] > gameData[channelID].score[winners[0]]) {
				winners = [id];
			} else if (gameData[channelID].score[id] === gameData[channelID].score[winners[0]]) {
				winners.push(id);
			}
		});
		if (winners.length > 1) {
			out += "It was a tie! The winners are <@" + winners.join(">, <@") + ">!";
		} else {
			out += "The winner is <@" + winners + ">!";
		}
	}
	return out;
}

function tlock(user, userID, channelID, message, event) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	if (serverID in triviaLocks) {
		let index = triviaLocks[serverID].indexOf(channelID);
		if (index > -1) {
			triviaLocks[serverID].splice(index, 1);
			if (triviaLocks[serverID].length > 0) {
				let out = [];
				for (let lock of triviaLocks[serverID]) {
					out.push("<#" + lock + ">");
				}
				sendMessage(user, userID, channelID, message, event, "Trivia no longer locked to this channel!\nTrivia is locked to the following channels on this server: " + out.join(", ")).catch(msgErrHandler);
				config.triviaLocks = triviaLocks;
				fs.writeFileSync("config/config.json", JSON.stringify(config, null, 4), "utf8");
			} else {
				delete triviaLocks[serverID];
				sendMessage(user, userID, channelID, message, event, "Trivia no longer locked to any channel on this server!").catch(msgErrHandler);
				config.triviaLocks = triviaLocks;
				fs.writeFileSync("config/config.json", JSON.stringify(config, null, 4), "utf8");
			}
		} else {
			triviaLocks[serverID].push(channelID);
			let out = [];
			for (let lock of triviaLocks[serverID]) {
				out.push("<#" + lock + ">");
			}
			sendMessage(user, userID, channelID, message, event, "Trivia locked to this channel!\nTrivia is locked to the following channels on this server: " + out.join(", ")).catch(msgErrHandler);
			config.triviaLocks = triviaLocks;
			fs.writeFileSync("config/config.json", JSON.stringify(config, null, 4), "utf8");
		}
	} else {
		triviaLocks[serverID] = [channelID];
		let out = [];
		for (let lock of triviaLocks[serverID]) {
			out.push("<#" + lock + ">");
		}
		sendMessage(user, userID, channelID, message, event, "Trivia locked to this channel!\nTrivia is locked to the following channels on this server: " + out.join(", ")).catch(msgErrHandler);
		config.triviaLocks = triviaLocks;
		fs.writeFileSync("config/config.json", JSON.stringify(config, null, 4), "utf8");
	}
}

//permission handling
function _getPermissionArray(number) {
	let permissions = [];
	let binary = (number >>> 0).toString(2).split("");
	binary.forEach((bit, index) => {
		if (bit == 0) {
			return;
		}
		Object.keys(Discord.Permissions).forEach(p => {
			if (Discord.Permissions[p] == (binary.length - index - 1)) {
				permissions.push(p);
			}
		});
	});
	return permissions;
}

function getPermissions(userID, channelID) {
	let serverID = bot.channels[channelID].guild_id;

	let permissions = [];
	
	bot.servers[serverID].members[userID].roles.concat([serverID]).forEach(roleID => {
		_getPermissionArray(bot.servers[serverID].roles[roleID]._permissions).forEach(perm => {
			if (permissions.indexOf(perm) < 0) {
				permissions.push(perm);
			}
		});
	});

	Object.keys(bot.channels[channelID].permissions).forEach(overwrite => {
		if ((overwrite.type == "member" && overwrite.id == userID) ||
			(overwrite.type == "role" &&
				(bot.servers[serverID].members[userID].roles.includes(overwrite.id)) ||
				serverID == overwrite.id)) {
			_getPermissionArray(overwrite.deny).forEach(denied => {
				let index = permissions.indexOf(denied);
				if (index > -1) {
					permissions.splice(index, 1);
				}
			});

			_getPermissionArray(overwrite.allow).forEach(allowed => {
				if (permissions.indexOf(allowed) < 0) {
					permissions.push(allowed);
				}
			});
		}
	});

	return permissions;
}

function checkForPermissions(userID, channelID, permissionValues) {
	let serverID = bot.channels[channelID].guild_id;
	if (userID === bot.servers[serverID].owner_id)
		return true;
	let permissions = getPermissions(userID, channelID);
	if (permissions.indexOf("GENERAL_ADMINISTRATOR") > -1)
		return true;
	let forbiddenPerms = [];
	permissionValues.forEach(permission => {
		if ((permissions.indexOf(permission) < 0)) {
			forbiddenPerms.push(permission);
		}
	});
	return forbiddenPerms.length === 0;
}

function servers(user, userID, channelID, message, event) {
	let out = "```\n";
	Object.keys(bot.servers).forEach(key => {
		out += bot.servers[key].name + "\t" + bot.servers[key].member_count + " members\n";
	});
	out += "```";
	sendMessage(user, userID, userID, message, event, out).catch(msgErrHandler);
}

function updatejson() {
	return new Promise(resolve => {
		for (let arg of Object.keys(sheetsDB)) {
			let sheetID = sheetsDB[arg];
			if (!arg || !(/\S/.test(arg)) || !sheetID) { //if null or empty
				if (!sheetID)
					console.error(arg + ".json is not mapped.");
				continue;
			}
			gstojson({
				spreadsheetId: sheetID,
			}).then(result => {
				fs.writeFileSync("dbs/" + arg + ".json", JSON.stringify(result), "utf8");
				console.log(arg + ".json updated successfully.");
			}).catch(err => {
				console.error(err.message);
			});
		}
		setJSON();
		resolve();
	});
}

function updateSetcodes() {
	return new Promise(resolve => {
		console.log("Downloading strings file from " + setcodeSource + "...");
		https.get(url.parse(setcodeSource), response => {
			let data = [];
			response.on("data", chunk => {
				data.push(chunk);
			}).on("end", () => {
				let buffer = Buffer.concat(data);
				let file = buffer.toString();
				console.log("Strings file downloaded. Extracting setcodes...");
				let tempCodes = {};
				for (let line of file.split("\r\n")) {
					if (line.startsWith("!setname")) {
						let code = line.split(" ")[1];
						let name = line.slice(line.indexOf(code) + code.length + 1);
						tempCodes[code] = name;
					}
				}
				console.log("Setcodes assembled, writing to file...");
				fs.writeFileSync("config/" + setsDB, JSON.stringify(tempCodes), "utf-8");
				setcodes = tempCodes;
				Card = require("./card.js")(setcodes);
				console.log("Setcodes updated!");
				resolve();
			});
		});
	});
}

function updateLflist() {
	return new Promise(resolve => {
		console.log("Downloading banlist file from " + lflistSource + "...");
		https.get(url.parse(lflistSource), response => {
			let data = [];
			response.on("data", chunk => {
				data.push(chunk);
			}).on("end", () => {
				let buffer = Buffer.concat(data);
				let file = buffer.toString();
				console.log("Banlist file found. Converting...");
				let tempList = {};
				let currentList = "";
				for (let line of file.split("\r\n")) {
					if (line.startsWith("#")) {
						continue;
					}
					if (line.startsWith("!")) {
						currentList = line.split(" ")[1];
						tempList[currentList] = {};
						console.log("Reading " + currentList + " banlist..");
						continue;
					}
					tempList[currentList][line.split(" ")[0]] = line.split(" ")[1];
				}
				console.log("Banlist assembled, writing to file...");
				fs.writeFileSync("config/" + banDB, JSON.stringify(tempList), "utf-8");
				lflist = tempList;
				console.log("Banlist updated!");
				resolve();
			});
		});
	});
}

//scripting lib 
function searchFunctions(user, userID, channelID, message, event, name) {
	let arg = message.slice((pre + name + " ").length);
	if (!arg || !(/\S/.test(arg))) { //if null or empty
		return;
	}
	let searched = [];
	for (let func of libFunctions) {
		if (func.name.toLowerCase().split("(")[0].includes(arg.toLowerCase())) {
			searched.push(func);
		}
	}
	let pages = [];
	while (searched.length) {
		pages.push(searched.splice(0, 9));
	}
	if (pages.length === 0) {
		return;
	}
	let out = "```cs\n";
	let len = 0;
	for (let i = 0; i < pages[0].length; i++) {
		if (pages[0][i].sig.length > len) {
			len = pages[0][i].sig.length;
		}
	}
	for (let i = 0; i < pages[0].length; i++) {
		let line = pages[0][i];
		out += "[" + (i + 1) + "] " + line.sig.padStart(len, " ") + " | " + line.name + "\n";
	}
	out += "````Page: 1/" + pages.length + "`";
	sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler).then(res => {
		searchPage[channelID] = {
			pages: pages,
			index: 0,
			user: userID,
			search: "f",
			message: res.id,
			content: out
		};
	});
}

function searchConstants(user, userID, channelID, message, event, name) {
	let arg = message.slice((pre + name + " ").length);
	if (!arg || !(/\S/.test(arg))) { //if null or empty
		return;
	}
	let searched = [];
	for (let con of libConstants) {
		if (con.name.toLowerCase().includes(arg.toLowerCase())) {
			searched.push(con);
		}
	}
	let pages = [];
	while (searched.length) {
		pages.push(searched.splice(0, 9));
	}
	if (pages.length === 0) {
		return;
	}
	let out = "```cs\n";
	let len = 0;
	for (let i = 0; i < pages[0].length; i++) {
		if (pages[0][i].val.length > len) {
			len = pages[0][i].val.length;
		}
	}
	for (let i = 0; i < pages[0].length; i++) {
		let line = pages[0][i];
		out += "[" + (i + 1) + "] " + line.val.toString().padStart(len, " ") + " | " + line.name + "\n";
	}
	out += "````Page: 1/" + pages.length + "`";
	sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler).then(res => {
		searchPage[channelID] = {
			pages: pages,
			index: 0,
			user: userID,
			search: "c",
			message: res.id,
			content: out
		};
	});
}

function searchParams(user, userID, channelID, message, event, name) {
	let arg = message.slice((pre + name + " ").length);
	if (!arg || !(/\S/.test(arg))) { //if null or empty
		return;
	}
	let searched = [];
	for (let par of libParams) {
		if (par.name.toLowerCase().includes(arg.toLowerCase())) {
			searched.push(par);
		}
	}
	let pages = [];
	while (searched.length) {
		pages.push(searched.splice(0, 9));
	}
	if (pages.length === 0) {
		return;
	}
	let out = "```cs\n";
	let len = 0;
	for (let i = 0; i < pages[0].length; i++) {
		if (pages[0][i].type.length > len) {
			len = pages[0][i].type.length;
		}
	}
	for (let i = 0; i < pages[0].length; i++) {
		let line = pages[0][i];
		out += "[" + (i + 1) + "] " + line.type.padStart(len, " ") + " | " + line.name + "\n";
	}
	out += "````Page: 1/" + pages.length + "`";
	sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler).then(res => {
		searchPage[channelID] = {
			pages: pages,
			index: 0,
			user: userID,
			search: "p",
			message: res.id,
			content: out
		};
	});
}

function libPage(user, userID, channelID, message, event, name) {
	let arg = parseInt(message.slice((pre + name).length));
	if (!searchPage[channelID] || userID !== searchPage[channelID].user || isNaN(arg) || arg > searchPage[channelID].pages.length) {
		return;
	}
	let index = arg - 1;
	let len = 0;
	let pages = searchPage[channelID].pages;
	let n = "sig";
	switch (searchPage[channelID].search) {
	case "c":
		n = "val";
		break;
	case "p":
		n = "type";
		break;
	default:
		break;
	}
	if (!pages[index]) {
		return;
	}
	for (let line of pages[index]) {
		if (line[n].length > len) {
			len = line[n].length;
		}
	}
	let out = "```cs\n";
	for (let i = 0; i < pages[index].length; i++) {
		let line = pages[index][i];
		out += "[" + (i + 1) + "] " + line[n].toString().padStart(len, " ") + " | " + line.name + "\n";
	}
	out += "````Page: " + arg + "/" + pages.length + "`";
	searchPage[channelID].index = index;
	searchPage[channelID].content = out;
	if (messageMode > 0) {
		bot.editMessage({
			channelID: channelID,
			messageID: searchPage[channelID].message,
			embed: {
				color: embedColor,
				description: out
			}
		});
	} else {
		bot.editMessage({
			channelID: channelID,
			messageID: searchPage[channelID].message,
			message: out
		});
	}
}

function libDesc(user, userID, channelID, message, event, name) {
	let arg = parseInt(message.slice((pre + name).length));
	if (!searchPage[channelID] || userID !== searchPage[channelID].user || isNaN(arg) || arg > searchPage[channelID].pages[searchPage[channelID].index].length) {
		return;
	}
	let index = arg - 1;
	if (!searchPage[channelID].pages[searchPage[channelID].index][index]) {
		return;
	}
	let desc = searchPage[channelID].pages[searchPage[channelID].index][index].desc;
	if (desc.length === 0) {
		desc = "No description found for this entry.";
	}
	if (messageMode > 0) {
		bot.editMessage({
			channelID: channelID,
			messageID: searchPage[channelID].message,
			embed: {
				color: embedColor,
				description: searchPage[channelID].content + "\n`" + desc + "`"
			}
		});
	} else {
		bot.editMessage({
			channelID: channelID,
			messageID: searchPage[channelID].message,
			message: searchPage[channelID].content + "\n`" + desc + "`"
		});
	}
}
