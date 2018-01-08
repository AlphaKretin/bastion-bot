let fs = require('fs');

let config = JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
//load data from JSON. Expected values can be intuited from console feedback or seen in the readme.
if (!config.token) {
	console.log("No Discord user token found at config.token! Exiting..."); //need the token to work as a bot, rest can be left out or defaulted. 
	return;
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
		console.log("URL for anime image source not found at config.imageUrlAnime! Defaulting to same source as official cards, " + imageUrlMaster + "!");
	}
	if (config.imageUrlCustom) {
		imageUrlCustom = config.imageUrlCustom;
	} else {
		imageUrlCustom = imageUrlMaster;
		console.log("URL for custom image source not found at config.imageUrlCustom! Defaulting to same source as official cards, " + imageUrlMaster + "!");
	}
	if (config.imageSize) {
		imageSize = config.imageSize;
	} else {
		console.log("Size for images not found at config.imageSize! Defaulting to " + imageSize + "!");
	}
	if (config.triviaTimeLimit) {
		triviaTimeLimit = config.triviaTimeLimit;
	} else {
		console.log("No time limit for trivia found at config.triviaTimeLimit! Defaulting to " + triviaTimeLimit + "!");
	}
	if (config.triviaHintTime) {
		triviaHintTime = config.triviaHintTime;
	} else {
		console.log("No hint time for trivia found at config.triviaHintTime! Defaulting to " + triviaHintTime + "!");
	}
	if (config.triviaMaxRounds) {
		triviaMaxRounds = config.triviaMaxRounds;
	} else {
		console.log("No hint time for trivia found at config.triviaMaxRounds! Defaulting to " + triviaMaxRounds + "!");
	}
	if (config.triviaLocks) {
		triviaLocks = config.triviaLocks;
	} else {
		console.log("No specifications for channels to lock trivia to found at config.triviaLocks! Defaulting to nothing, configure with \".tlock\" command!");
	}
	if (config.imageExt) {
		imageExt = config.imageExt;
	} else {
		console.log("No file extension for images found at config.imageExt! Defaulting to " + imageExt + "!");
	}
} else {
	console.log("URL for image source not found at config.imageUrl! Image lookup and trivia will be disabled.");
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
	console.log("Emote database not found at config.emotesDB! Emotes display will be disabled.");
} else if (config.emoteMode === undefined || config.emoteMode === null) {
	console.log("Emote mode specification not found at config.emoteMode! Defaulting to " + emoteMode + "!");
}

let messageMode = 0;
let embedColor = 0x1;
let embcDB;

if (config.messageMode || config.messageMode === 0) {
	messageMode = config.messageMode;
} else {
	console.log("Message mode specification not found at config.messageMode! Defaulting to " + messageMode + "!");
}
if (messageMode & 0x2 && config.embedColor) {
	embedColor = config.embedColor;
} else if (messageMode & 0x2) {
	console.log("Embed color specification not found at config.embedColor! Defaulting to " + embedColor + "!");
}
if (messageMode & 0x2 && config.embedColorDB) {
	let path = "config/" + config.embedColorDB;
	embcDB = JSON.parse(fs.readFileSync(path, "utf-8"));
} else if (messageMode & 0x2) {
	console.log("Embed color database not found at config.embedColorDB! Card Type specific embed color will be set to default.");
}

let quo = messageMode & 0x1 && "`" || "";
let bo = messageMode & 0x1 && "**" || "";
let jvex = messageMode & 0x1 && "java\n" || "";

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
		console.log("URL for anime script source not found at config.scriptUrlAnime! Defaulting to same source as official cards, " + scriptUrlMaster + "!");
	}
	if (config.scriptUrlCustom) {
		scriptUrlCustom = config.scriptUrlCustom;
	} else {
		scriptUrlCustom = scriptUrlMaster;
		console.log("URL for custom script source not found at config.scriptUrlCustom! Defaulting to same source as official cards, " + scriptUrlMaster + "!");
	}
	if (config.scriptUrlBackup) {
		scriptUrlBackup = config.scriptUrlBackup;
	} else {
		console.log("URL for backup script source not found at config.scriptUrlBackup! Bastion will not try to find an alternative to missing scripts!");
	}
} else {
	console.log("URL for script source not found at config.scriptUrl! Script lookup will be disabled.");
}

let pre = ".";
if (config.prefix) {
	pre = config.prefix;
} else {
	console.log("No prefix found at config.prefix! Defaulting to \"" + pre + "\"!");
}
let longStr = "...\n__Type `" + pre + "long` to be PMed the rest!__";
if (config.longStr) {
	longStr = config.longStr;
} else {
	console.log("No long message string found at config.longStr! Defaulting to \"" + longStr + "\"!");
}
let helpMessage = "I am a Yu-Gi-Oh! card bot made by AlphaKretin#7990.\nPrice data is from the <https://yugiohprices.com> API.\nYou can find my help file and source here: <https://github.com/AlphaKretin/bastion-bot/>\nYou can support my development on Patreon here: <https://www.patreon.com/alphakretinbots>\nType `" + pre + "commands` to be DMed a short summary of my commands without going to an external website.";
if (config.helpMessage) {
	helpMessage = config.helpMessage;
} else {
	console.log("Help message not found at console.helpMessage! Defaulting to \"" + helpMessage + "\"!");
}
if (messageMode & 0x1) {
	helpMessage = bo + quo + helpMessage + quo + bo;
}

let maxSearches = 3;
if (config.maxSearches) {
	maxSearches = config.maxSearches;
} else {
	console.log("No upper limit on searches in one message found at config.maxSearches! Defaulting to " + maxSearches + "!");
}

let defaultLang = "en";
if (config.defaultLanguage) {
	defaultLang = config.defaultLanguage;
} else {
	console.log("Default language not found at config.defaultLanguage! Defaulting to " + defaultLang + "!");
}

let rulingLang;
if (config.rulingLanguage) {
	rulingLang = config.rulingLanguage;
} else {
	console.log("Japanese language for rulings not found at config.rulingLanguage! Ruling search will be disabled.");
}

let dbs = {};
dbs[defaultLang] = ["cards.cdb"];
if (config.dbs) {
	dbs = config.dbs;
} else {
	console.log("List of card databases not found at config.dbs! Defaulting to one database named " + dbs[defaultLang][0] + ".");
}
let dbMemory = 33554432;
if (config.dbMemory) {
	dbMemory = config.dbMemory;
} else {
	console.log("Size of memory allocated for card databases not found at config.dbMemory! Defaulting to " + dbMemory + ".");
}
let owner;
if (config.botOwner) {
	owner = config.botOwner;
} else {
	console.log("Bot owner's ID not found at config.botOwner! Owner commands will be disabled.");
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
	} else {
		console.log("Path to function library not found at config.scriptFunctions! Function library will be disabled!");
	}
	if (config.scriptConstants) {
		let path = "dbs/" + config.scriptConstants;
		libConstants = JSON.parse(fs.readFileSync(path, "utf-8"));
	} else {
		console.log("Path to constant library not found at config.scriptFunctions! Constant library will be disabled!");
	}
	if (config.scriptParams) {
		let path = "dbs/" + config.scriptParams;
		libParams = JSON.parse(fs.readFileSync(path, "utf-8"));
	} else {
		console.log("Path to parameter library not found at config.scriptFunctions! Parameter library will be disabled!");
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
		console.log("Path to Duel Links Skill database not found at config.skillDB! Skill lookup will be disabled.");
	}
}



let sheetsDB;
let gstojson = require('google-spreadsheet-to-json');
if (owner && config.sheetsDB) {
	let path = "config/" + config.sheetsDB;
	sheetsDB = JSON.parse(fs.readFileSync(path, "utf-8"));
} else if (!owner) {
	console.log("Bot owner's ID not set up! JSON updating commands will be disabled.");
} else {
	console.log("Sheets database not found at config.sheetsDB! JSON updating commands will be disabled.");
}

let debugOutput = false;
if (config.debugOutput || config.debugOutput === false) {
	debugOutput = config.debugOutput;
} else {
	console.log("Choice whether to display debug information not found at config.debugOutput! Defaulting to not displaying it.");
}

let shortsDB = "shortcuts.json";
if (config.shortcutDB) {
	shortsDB = config.shortcutDB;
} else {
	console.log("Filename for shortcuts file not found at config.shortcutDB! Defaulting to " + shortsDB + ".");
}

let setsDB = "setcodes.json";
if (config.setcodesDB) {
	setsDB = config.setcodesDB;
} else {
	console.log("Filename for setcodes file not found at config.setcodesDB! Defaulting to " + setsDB + ".");
}

let banDB = "lflist.json";
if (config.lflistDB) {
	banDB = config.lflistDB;
} else {
	console.log("Filename for banlist file not found at config.lflistDB! Defaulting to " + banDB + ".");
}

let statsDB = "stats.json";
if (config.statsDB) {
	statsDB = config.statsDB;
} else {
	console.log("Filename for stats file not found at config.statsDB! Defaulting to " + statsDB + ".");
}

//more config files, all explained in the readme
let shortcuts = JSON.parse(fs.readFileSync('config/' + shortsDB, 'utf8'));
let setcodes = JSON.parse(fs.readFileSync('config/' + setsDB, 'utf8'));
let lflist = JSON.parse(fs.readFileSync('config/' + banDB, 'utf8'));
let stats = JSON.parse(fs.readFileSync('config/' + statsDB, 'utf8'));

let Card = require('./card.js')(setcodes); //initialises a "Card" Class, takes setcodes as an argument for handling archetypes as a class function

setInterval(function() {
	fs.writeFileSync("config/stats.json", JSON.stringify(stats), "utf8");
	console.log("Stats saved!");
}, 300000); //5 minutes

//sql setup
Module = {
	TOTAL_MEMORY: dbMemory
};
let SQL = require('sql.js');
let cards = {};
let nameList = {};
for (let lang in dbs) { //this reads the keys of an object loaded above, which are supposed to be the languages of the card databases in that field of the object
	console.log("loading " + lang + " database");
	let filebuffer = fs.readFileSync("dbs/" + dbs[lang][0]);
	let db = new SQL.Database(filebuffer);
	nameList[lang] = [];
	cards[lang] = {};
	let contents = db.exec("select * from datas,texts where datas.id=texts.id"); //see SQL.js documentation/example for the format of this return, it's not the most intuitive
	for (let card of contents[0].values) {
		let car = new Card(card);
		cards[lang][car.code] = car;
	}
	if (dbs[lang].length > 1) { //a language can have multiple DBs, and if so their data needs to be loaded into the results from the first as if they were all one DB.
		console.log("loading additional " + lang + " databases");
		for (let i = 1; i < dbs[lang].length; i++) {
			let newbuffer = fs.readFileSync("dbs/" + dbs[lang][i]);
			console.log("loading " + dbs[lang][i]);
			let newDB = new SQL.Database(newbuffer);
			let newContents = newDB.exec("select * from datas,texts where datas.id=texts.id");
			for (let newCard of newContents[0].values) {
				let newCar = new Card(newCard);
				cards[lang][newCar.code] = newCar;
			}
		}
	}
	Object.keys(cards[lang]).forEach(function(key, index) {
		nameList[lang].push({
			name: cards[lang][key].name,
			id: cards[lang][key].code
		});
	});
}

//fuse setup
let Fuse = require('fuse.js');
let options = {
	shouldSort: true,
	includeScore: true,
	threshold: 0.6,
	location: 0,
	distance: 100,
	maxPatternLength: 64,
	minMatchCharLength: 1,
	keys: [
		"name"
	]
};
let fuse = {};
for (let lang in dbs) {
	fuse[lang] = new Fuse(nameList[lang], options);
}

let skillFuse = {};
setJSON();

let request = require('request');
let https = require('https');
let url = require('url');
let jimp = require('jimp');
let filetype = require('file-type');

//these are used for various data that needs to persist between commands or uses of a command
let longMsg = "";
let gameData = {};
let searchPage = {
	active: false
};

//discord setup - this is last so that users can't interface with the bot until it's ready
let Discord = require('discord.io');

let bot = new Discord.Client({
	token: config.token,
	autorun: true
});

bot.on('ready', function() {
	console.log('Logged in as %s - %s\n', bot.username, bot.id);
});

bot.on('disconnect', function() { //Discord API occasionally disconnects bots for an unknown reason.
	console.log("Disconnected. Reconnecting...");
	bot.connect();
});

//command declaration
let commandList = [{
		names: ["randcard", "randomcard"],
		func: randomCard
	},
	{
		names: ["script"],
		func: script,
		chk: function() {
			return scriptUrlMaster;
		}
	},
	{
		names: ["trivia"],
		func: trivia,
		chk: function() {
			return imageUrlMaster;
		}
	},
	{
		names: ["tlock"],
		func: tlock,
		chk: function(user, userID, channelID) {
			return imageUrlMaster && checkForPermissions(userID, channelID, [8192]); //User must have manage message permission
		}
	},
	{
		names: ["matches", "match"],
		func: matches
	},
	{
		names: ["set", "setcode", "archetype", "setname", "sets"],
		func: set
	},
	{
		names: ["id"],
		func: getSingleProp
	},
	{
		names: ["notext", "stats"],
		func: getSingleProp
	},
	{
		names: ["effect", "cardtext"],
		func: getSingleProp
	},
	{
		names: ["strings"],
		func: strings
	},
	{
		names: ["deck"],
		func: deck
	},
	{
		names: ["commands"],
		func: commands
	},
	{
		names: ["rulings"],
		func: rulings,
		chk: function() {
			return rulingLang; //ruling search relies on Japanese DB
		}
	},
	{
		names: ["top", "rankings", "rank"],
		func: rankings
	},
	{
		names: ["function", "func", "f"],
		func: searchFunctions,
		chk: function() {
			return libFunctions;
		}
	},
	{
		names: ["constant", "const", "c"],
		func: searchConstants,
		chk: function() {
			return libConstants;
		}
	},
	{
		names: ["param", "parameter"],
		func: searchParams,
		chk: function() {
			return libParams;
		}
	},
	{
		names: ["p", "page"], //must be after param to avoid double-post
		func: libPage,
		chk: function() {
			return searchPage.active;
		}
	},
	{
		names: ["d", "desc", "description"],
		func: libDesc,
		chk: function() {
			return searchPage.active;
		}
	},
	{
		names: ["skill"],
		func: searchSkill,
		chk: function() {
			return skills.length > 0;
		}
	},
	{
		names: ["servers", "serverlist"],
		func: servers,
		chk: function(user, userID) {
			return owner && owner.indexOf(userID) > -1;
		},
		noTrack: true
	},
	{
		names: ["updatejson"],
		func: updatejson,
		chk: function(user, userID) {
			return owner && sheetsDB && owner.indexOf(userID) > -1;
		},
		noTrack: true
	},
	{
		names: ["long"],
		func: function(user, userID) {
			if (messageMode & 0x2) {
				bot.sendMessage({
					to: userID,
					embed: {
						color: embedColor,
						description: bo + quo + quo + quo + longMsg,
					}
				});
			} else {
				bot.sendMessage({
					to: userID,
					message: bo + quo + quo + quo + longMsg
				});
			}
		},
		chk: function() {
			return longMsg.length > 0;
		}
	}
];

bot.on('message', function(user, userID, channelID, message, event) {
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
	if (message.indexOf("<@" + bot.id + ">") > -1 || lowMessage.startsWith(pre + "help")) {
		//send help message
		if (messageMode & 0x2) {
			bot.sendMessage({
				to: channelID,
				embed: {
					color: embedColor,
					description: helpMessage,
				}
			});
		} else {
			bot.sendMessage({
				to: channelID,
				message: helpMessage
			});
		}
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
		if (regx && regx[1].length > 0 && regx[1].indexOf(":") !== 0 && regx[1].indexOf("@") !== 0 && regx[1].indexOf("#") !== 0 && regx[1].indexOf("http") === -1) { //ignores <@mentions>, <#channels>, <http://escaped.links> and <:customEmoji:126243>. All these only apply for <>, but doesn't hurt to use the same check here
			results.push(regx[1]);
		}
	} while (regx);
	let results2 = [];
	if (imageUrlMaster) {
		let re2 = /<(.*?)>/g; //gets text between <>
		let regx2;
		do {
			regx2 = re2.exec(message);
			if (regx2 && regx2[1].length > 0 && regx2[1].indexOf(":") !== 0 && regx2[1].indexOf("@") !== 0 && regx2[1].indexOf("#") !== 0 && regx2[1].indexOf("http") === -1) { //ignores <@mentions>, <#channels>, <http://escaped.links> and <:customEmoji:126243>
				results2.push(regx2[1]);
			}
		} while (regx2);
	}
	if (results.length + results2.length > maxSearches) {
		if (messageMode & 0x2) {
			bot.sendMessage({
				to: channelID,
				embed: {
					color: embedColor,
					description: "You can only search up to " + maxSearches + " cards!",
				}
			});
		} else {
			bot.sendMessage({
				to: channelID,
				message: "You can only search up to " + maxSearches + " cards!"
			});
		}
	} else {
		if (results.length > 0) {
			for (let result of results) {
				searchCard(result, false, user, userID, channelID, message, event); //second parameter here is whether to display image or not
				if (stats.cmdRankings["search (no image)"]) {
					stats.cmdRankings["search (no image)"]++;
				} else {
					stats.cmdRankings["search (no image)"] = 1;
				}
			}
		}
		if (results2.length > 0) {
			for (let result of results2) {
				searchCard(result, true, user, userID, channelID, message, event);
				if (stats.cmdRankings["search (with image)"]) {
					stats.cmdRankings["search (with image)"]++;
				} else {
					stats.cmdRankings["search (with image)"] = 1;
				}
			}
		}
	}
});

bot.on('messageUpdate', function(oldMsg, newMsg, event) { //a few commands can be met by edit
	if (newMsg.author && newMsg.author.id === bot.id) { //have to check a lot of variables exist at all because for some stupid reason an embed being added also counts as editing a message. Dammit Discord
		return;
	}
	let lowMessage = newMsg.content && newMsg.content.toLowerCase();
	if (searchPage.active && lowMessage && lowMessage.startsWith(pre + "p") && lowMessage.indexOf("param") === -1) {
		libPage(newMsg.author.username, newMsg.author.id, newMsg.channelID, newMsg.content, event, "p");
	}
	if (searchPage.active && lowMessage && lowMessage.startsWith(pre + "page") && lowMessage.indexOf("param") === -1) {
		libPage(newMsg.author.username, newMsg.author.id, newMsg.channelID, newMsg.content, event, "page");
	}
	if (searchPage.active && lowMessage && lowMessage.startsWith(pre + "d")) {
		libDesc(newMsg.author.username, newMsg.author.id, newMsg.channelID, newMsg.content, event, "d");
	}
	if (searchPage.active && lowMessage && lowMessage.startsWith(pre + "desc")) {
		libDesc(newMsg.author.username, newMsg.author.id, newMsg.channelID, newMsg.content, event, "desc");
	}
	if (searchPage.active && lowMessage && lowMessage.startsWith(pre + "description")) {
		libDesc(newMsg.author.username, newMsg.author.id, newMsg.channelID, newMsg.content, event, "description");
	}
});

function commands(user, userID, channelID, message, event) {
	//obviously these don't all need to be seperate lines and I don't even need to define anything here but I like having each command on a new line of code.
	let out = "Type a card name or ID between `{}` (or `<>` for images) to see its profile.\n";
	out += "`" + pre + "randcard` displays a random card profile.\n";
	out += "`" + pre + "script` displays the YGOPro script of the specified card.\n";
	out += "`" + pre + "matches` displays the 10 card names Bastion thinks are most similar to the text you type after.\n";
	out += "`" + pre + "skill` searches for a skill from Duel Links.\n";
	out += "`" + pre + "set` translates between YGOPro setcodes and their name.\n";
	out += "`" + pre + "f`, `" + pre + "c` and `" + pre + "p` search for the functions, constants and parameters respectively used for scripting in YGOPro.\n";
	out += "`" + pre + "trivia` plays a game where you guess a card name from its image.\n";
	out += "See the readme for details and other commands I skimmed over: <https://github.com/AlphaKretin/bastion-bot/>";
	if (messageMode & 0x2) {
		bot.sendMessage({
			to: userID,
			embed: {
				color: embedColor,
				description: out,
			}
		});
	} else {
		bot.sendMessage({
			to: userID,
			message: out
		});
	}
}

async function randomCard(user, userID, channelID, message, event) { //anything that gets card data has to be async because getting the price involves a Promise
	try {
		let args = message.toLowerCase().split(" ");
		let code;
		let i = 0;
		let outLang = defaultLang;
		for (let arg of args) {
			if (arg in dbs) {
				outLang = arg;
			}
		}
		let ids = Object.keys(cards[outLang]);
		if (args.length > 1) {
			let matches = [];
			for (let id of ids) { //gets a list of all cards that meet specified critera, before getting a random one of those cards
				if (randFilterCheck(id, args, outLang)) { //a number of filters can be specified in the command, and this checks that a card meets them
					matches.push(id);
				}
			}
			if (matches.length === 0) {
				return;
			}
			code = matches[Math.floor(Math.random() * matches.length)];
		} else {
			code = ids[Math.floor(Math.random() * ids.length)];
		}
		let out = await getCardInfo(code, outLang, user, userID, channelID, message, event); //returns a list of IDs for the purposes of cards with multiple images, as well as of course the card's profile
		if (imageUrlMaster && args.indexOf("image") > -1) {
			if (out[1].length == 1 && messageMode & 0x2) {
				sendLongMessage(out[0], user, userID, channelID, message, event, out[2], out[3], out[1][0], outLang);
			} else {
				postImage(out[1], out[0], outLang, user, userID, channelID, message, event, out[2], out[3]); //postImage also handles sending the message
			}
		} else {
			sendLongMessage(out[0], user, userID, channelID, message, event, out[2], out[3]); //in case a message is over 2k characters (thanks Ra anime), this splits it up
		}
	} catch (e) {
		console.log(e);
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
			let out = await getCardScript(cards[inLang][inInt], user, userID, channelID, message, event);
			sendLongMessage(out, user, userID, channelID, message, event);
		} catch (e) {
			console.log("Error with search by ID:");
			console.log(e);
		}
	} else { //if it wasn't an ID, the only remaining valid option is that it's a name
		try {
			let code = nameCheck(input, inLang); //this handles all the fuzzy search stuff
			if (code && code in cards[inLang]) {
				let out = await getCardScript(cards[inLang][code], user, userID, channelID, message, event);
				sendLongMessage(out, user, userID, channelID, message, event);
			} else {
				console.log("Invalid card ID or name, please try again.");
				return;
			}
		} catch (e) {
			console.log("Error with search by name:");
			console.log(e);
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
			let out = await getCardInfo(inInt, outLang, user, userID, channelID, message, event);
			if (hasImage) {
				if (out[1].length == 1 && messageMode & 0x2) {
					sendLongMessage(out[0], user, userID, channelID, message, event, out[2], out[3], out[1][0], outLang);
				} else {
					postImage(out[1], out[0], outLang, user, userID, channelID, message, event, out[2], out[3]); //postImage also handles sending the message
				}
			} else {
				sendLongMessage(out[0], user, userID, channelID, message, event, out[2], out[3]); //in case a message is over 2k characters (thanks Ra anime), this splits it up
			}
		} catch (e) {
			console.log("Error with search by ID:");
			console.log(e);
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
				let out = await getCardInfo(code, outLang, user, userID, channelID, message, event);
				if (hasImage) {
					if (out[1].length == 1 && messageMode & 0x2) {
						sendLongMessage(out[0], user, userID, channelID, message, event, out[2], out[3], out[1][0], outLang);
					} else {
						postImage(out[1], out[0], outLang, user, userID, channelID, message, event, out[2], out[3]); //postImage also handles sending the message
					}
				} else {
					sendLongMessage(out[0], user, userID, channelID, message, event, out[2], out[3]); //in case a message is over 2k characters (thanks Ra anime), this splits it up
				}
			} else {
				console.log("Invalid card or no corresponding entry in out language DB, please try again.");
				return;
			}
		} catch (e) {
			console.log("Error with search by name:");
			console.log(e);
		}
	}
}

function getCardInfo(code, outLang, user, userID, channelID, message, event) {
	return new Promise(function(resolve, reject) {
		let markdownno = 0;
		if (!code || !cards[outLang][code]) {
			console.log("Invalid card ID, please try again.");
			reject("Invalid card ID, please try again.");
		}
		let card = cards[outLang][code];
		let alIDs = [code];
		if (card.alias > 0 && cards[outLang][card.alias]) { //if the card has an alias, e.g. IS the alt art
			alCard = cards[outLang][card.alias];
			if (card.ot === alCard.ot && card.name === alCard.name) { //If the card with the alias is the same OT as the card with the base ID, then it's an alt art as opposed to an anime version or pre errata or something. However if the name is different it's a Fusion Sub or Harpie Lady.
				code = alCard.code;
				alIDs = [code];
				Object.keys(cards[outLang]).forEach(function(key, index) {
					if (cards[outLang][key].alias === code && cards[outLang][key].ot === alCard.ot) {
						alIDs.push(cards[outLang][key].code);
					}
				});
			}
		} else { //if other cards have this, the original, as an alias, they'll be noted here
			Object.keys(cards[outLang]).forEach(function(key, index) {
				if (cards[outLang][key].alias === code && cards[outLang][key].ot === card.ot && cards[outLang][key].name === card.name) {
					alIDs.push(cards[outLang][key].code);
				}
			});
		}
		let out = "__**" + quo + card.name + quo + "**__\n";
		markdownno += quo.length * 2;
		if (messageMode & 0x1) {
			out += bo + quo + quo + quo + jvex + "ID: ";
		} else {
			out += "**ID**: ";
		}
		markdownno += quo.length * 3 + bo.length + jvex.length;
		out += alIDs.join("|") + "\n";
		if (card.sets) {
			if (messageMode & 0x1) {
				out += "Archetype: ";
			} else {
				out += "**Archetype**: ";
			}
			out += card.sets.join(", ");
		}
		out += "\n";
		let stat = card.ot;
		Object.keys(lflist).forEach(function(key, index) { //keys of the banlist table are card IDs, values are number of copies allowed
			if (stat.indexOf(key) > -1) {
				let lim = 3;
				if (lflist[key][code] || lflist[key][code] === 0) { //0 cast to a bool becomes false, so we need to check it explicitly. Ugh.
					lim = lflist[key][code];
				}
				let re = new RegExp(key);
				stat = stat.replace(re, key + ": " + lim);
			}
		});
		request('https://yugiohprices.com/api/get_card_prices/' + card.name, function(error, response, body) { //https://yugiohprices.docs.apiary.io/#reference/checking-card-prices/check-price-for-card-name/check-price-for-card-name
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
					if (messageMode & 0x1) {
						out += "Status: " + stat + " Price: $" + low.toFixed(2) + "-$" + avg.toFixed(2) + "-$" + hi.toFixed(2) + " USD\n";
					} else {
						out += "**Status**: " + stat + " **Price**: $" + low.toFixed(2) + "-$" + avg.toFixed(2) + "-$" + hi.toFixed(2) + " USD\n";
					}
				} else {
					if (messageMode & 0x1) {
						out += "Status: ";
					} else {
						out += "**Status**: ";
					}
					out += stat + "\n";
				}
			} else {
				if (messageMode & 0x1) {
					out += "Status: ";
				} else {
					out += "**Status**: ";
				}
				out += stat + "\n";
			}
			let embCT = getEmbCT(card);
			if (card.types.indexOf("Monster") > -1) {
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
				if (messageMode & 0x1) {
					out += "Type: " + typesStr + " Attribute: " + addEmote(card.attribute, "|")[0] + "\n";
				} else {
					out += "**Type**: " + typesStr + " **Attribute**: " + addEmote(card.attribute, "|")[emoteMode] + "\n";
				}
				let lvName = "Level";
				if (card.types.indexOf("Xyz") > -1) {
					lvName = "Rank";
				} else if (card.types.indexOf("Link") > -1) {
					lvName = "Link Rating";
				}
				if (messageMode & 0x1) {
					out += lvName + ": " + card.level;
				} else {
					out += "**" + lvName + "**: " + card.level + " ";
				}
				if (emoteMode > 0) {
					if (messageMode & 0x1) {
						if (lvName == "Level") {
							out += "✪";
						} else if (lvName == "Rank") {
							out += "⍟";
						}
					} else {
						if (card.isType(0x1000000000)) { //is dark synchro
							out += emoteDB["NLevel"] + " ";
						} else {
							out += emoteDB[lvName] + " ";
						}
					}
				}
				out += " ";
				if (messageMode & 0x1) {
					out += "ATK: ";
				} else {
					out += "**ATK**: ";
				}
				out += card.atk + " ";
				if (card.def) {
					if (messageMode & 0x1) {
						out += "DEF: ";
					} else {
						out += "**DEF**: ";
					}
					out += card.def;
				} else {
					if (messageMode & 0x1) {
						out += "Link Markers: ";
					} else {
						out += "**Link Markers**: ";
					}
					out += card.markers;
				}
				if (card.types.indexOf("Pendulum") > -1) {
					if (messageMode & 0x1) {
						out += " Pendulum Scale: ";
					} else {
						out += " **Pendulum Scale**: ";
					}
					if (emoteMode > 0) {
						if (messageMode & 0x1) {
							out += "←" + card.lscale + "/" + card.rscale + "→ ";
						} else {
							out += " " + card.lscale + emoteDB["L.Scale"] + " " + emoteDB["R.Scale"] + card.rscale + " ";
						}
					} else {
						out += card.lscale + "/" + card.rscale;
					}
				}
				out += "\n";
				out += quo + quo + quo + quo + quo + quo;
				markdownno += quo.length * 6;
				let cardText = card.desc;
				let textName = "Monster Effect";
				if (card.types.indexOf("Normal") > -1) {
					textName = "Flavour Text";
				}
				if (cardText.length === 4) {
					if (messageMode & 0x1) {
						out += cardText[0] + "``` ``" + cardText[2] + "``\n" + "```" + cardText[1] + "`````" + cardText[3] + "``";
					} else {
						out += "**" + cardText[2] + "**: " + cardText[0] + "\n";
						out += "**" + cardText[3] + "**: " + cardText[1];
					}
				} else {
					if (messageMode & 0x1) {
						out += cardText[0] + "``` ``" + textName + "``";
					} else {
						out += "**" + textName + "**: " + cardText[0];
					}
				}
				markdownno += quo.length * 3;
			} else if (card.types.indexOf("Spell") > -1 || card.types.indexOf("Trap") > -1) {
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
					if (messageMode & 0x1) {
						out += "Type: " + typesStr + " Attribute: " + addEmote(card.attribute, "|")[0] + "\n";
						out += "Level: " + card.level;
					} else {
						out += "**Type**: " + typesStr + " **Attribute**: " + addEmote(card.attribute, "|")[emoteMode] + "\n";
						out += "**Level**: " + card.level;
					}
					if (emoteMode > 0) {
						if (messageMode & 0x1) {
							out += "✪";
						} else {
							out += " " + emoteDB["Level"];
						}
					}
					if (messageMode & 0x1) {
						out += " " + " ATK: " + card.atk + " DEF: " + card.def + "\n";
					} else {
						out += " " + " **ATK**: " + card.atk + " **DEF**: " + card.def + "\n";
					}
				} else {
					if (messageMode & 0x1) {
						out += "Type: " + typeemote[0] + "\n";
					} else {
						out += "**Type**: " + typeemote[emoteMode] + "\n";
					}
				}
				if (messageMode & 0x1) {
					out += "``````" + card.desc[0].replace(/\n/g, "\n") + "``` ``Effect``\n";
				} else {
					out += "**Effect**: " + card.desc[0].replace(/\n/g, "\n");
				}
				markdownno += quo.length * 3;
			} else {
				if (messageMode & 0x1) {
					out += "``````" + name[2].replace(/\n/g, "\n") + "``` ``Card Text``";
				} else {
					out += "**Card Text**: " + name[2].replace(/\n/g, "\n");
				}
				markdownno += quo.length * 3;
			}
			out += bo;
			resolve([out, alIDs, embCT, markdownno]);
		});
	});
}

async function postImage(code, out, outLang, user, userID, channelID, message, event, embCT, markdownno) {
	try {
		let imageUrl = imageUrlMaster;
		let card = cards[outLang][code[0]];
		let ot = card.ot;
		if (["Anime", "Illegal", "Video Game"].indexOf(ot) > -1) {
			imageUrl = imageUrlAnime;
		}
		if (ot === "Custom") {
			imageUrl = imageUrlCustom;
		}
		if (code.length > 1) {
			let pics = [];
			for (let cod of code) {
				let buffer = await downloadImage(imageUrl + cod + "." + imageExt, user, userID, channelID, message, event);
				if (filetype(buffer) && filetype(buffer).ext === imageExt) {
					pics.push(await new Promise(function(resolve, reject) {
						jimp.read(buffer, function(err, image) {
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
					await new Promise(function(resolve, reject) {
						new jimp(imgSize + tempImg.bitmap.width, imageSize, function(err, image) {
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
					await new Promise(function(resolve, reject) {
						new jimp(outImg.bitmap.width, outImg.bitmap.height + imageSize, function(err, image) {
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
			let buffer = await new Promise(function(resolve, reject) {
				outImg.getBuffer(jimp.AUTO, function(err, res) {
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
			}, function(err, res) {
				sendLongMessage(out, user, userID, channelID, message, event, embCT, markdownno);
			});
		} else {
			let buffer = await downloadImage(imageUrl + code[0] + "." + imageExt, user, userID, channelID, message, event);
			if (buffer) {
				bot.uploadFile({
					to: channelID,
					file: buffer,
					filename: code[0] + "." + imageExt
				}, function(err, res) {
					sendLongMessage(out, user, userID, channelID, message, event, embCT, markdownno);
				});
			} else {
				sendLongMessage(out, user, userID, channelID, message, event, embCT, markdownno);
			}
		}
	} catch (e) {
		console.log(e);
	}

}

function downloadImage(imageUrl, user, userID, channelID, message, event) {
	return new Promise(function(resolve, reject) {
		if (debugOutput) {
			console.log("Debug Data: " + imageUrl);
			console.dir(url.parse(imageUrl));
		}
		https.get(url.parse(imageUrl), function(response) {
			let data = [];
			response.on('data', function(chunk) {
				data.push(chunk);
			}).on('end', function() {
				let buffer = Buffer.concat(data);
				if (filetype(buffer) && filetype(buffer).ext === imageExt) {
					jimp.read(buffer, function(err, image) {
						if (err) {
							reject(err);
						} else {
							image.resize(jimp.AUTO, imageSize);
							image.getBuffer(jimp.AUTO, function(err, res) {
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
		switch (prop) {
			case "id":
				let alIDs = [code];
				if (card.alias > 0 && cards[outLang][card.alias]) { //if the card has an alias, e.g. IS the alt art
					alCard = cards[outLang][card.alias];
					if (card.ot === alCard.ot && card.name === alCard.name) { //If the card with the alias is the same OT as the card with the base ID, then it's an alt art as opposed to an anime version or pre errata or something. However if the name is different it's a Fusion Sub or Harpie Lady.
						code = alCard.code;
						alIDs = [code];
						Object.keys(cards[outLang]).forEach(function(key, index) {
							if (cards[outLang][key].alias === code && cards[outLang][key].ot === alCard.ot) {
								alIDs.push(cards[outLang][key].code);
							}
						});
					}
				} else {
					Object.keys(cards[outLang]).forEach(function(key, index) {
						if (cards[outLang][key].alias === code && cards[outLang][key].ot === card.ot) {
							alIDs.push(cards[outLang][key].code);
						}
					});
				}
				out += bo + quo + quo + quo + jvex + card.name + ": " + alIDs.join("|") + quo + quo + quo + bo;
				break;
			case "notext":
				out += "__**" + quo + card.name + quo + "**__\n";
				let alIs = [code];
				if (card.alias > 0 && cards[outLang][card.alias]) { //if the card has an alias, e.g. IS the alt art
					alCard = cards[outLang][card.alias];
					if (card.ot === alCard.ot && card.name === alCard.name) { //If the card with the alias is the same OT as the card with the base ID, then it's an alt art as opposed to an anime version or pre errata or something. However if the name is different it's a Fusion Sub or Harpie Lady.
						code = alCard.code;
						alIs = [code];
						Object.keys(cards[outLang]).forEach(function(key, index) {
							if (cards[outLang][key].alias === code && cards[outLang][key].ot === alCard.ot) {
								alIs.push(cards[outLang][key].code);
							}
						});
					}
				} else {
					Object.keys(cards[outLang]).forEach(function(key, index) {
						if (cards[outLang][key].alias === code && cards[outLang][key].ot === card.ot && cards[outLang][key].name === card.name) {
							alIs.push(cards[outLang][key].code);
						}
					});
				}
				if (messageMode & 0x1) {
					out += bo + quo + quo + quo + jvex + "ID: " + alIs.join("|") + "\n";
				} else {
					out += "**ID**: " + alIs.join("|") + "\n";
				}
				if (card.sets) {
					if (messageMode & 0x1) {
						out += "Archetype: ";
					} else {
						out += "**Archetype**: ";
					}
					out += card.sets.join(", ");
				}
				out += "\n";
				let stat = card.ot;
				Object.keys(lflist).forEach(function(key, index) { //keys of the banlist table are card IDs, values are number of copies allowed
					if (stat.indexOf(key) > -1) {
						let lim = 3;
						if (lflist[key][code] || lflist[key][code] === 0) { //0 cast to a bool becomes false, so we need to check it explicitly. Ugh.
							lim = lflist[key][code];
						}
						let re = new RegExp(key);
						stat = stat.replace(re, key + ": " + lim);
					}
				});
				if (messageMode & 0x1) {
					out += "Status: ";
				} else {
					out += "**Status**: ";
				}
				out += stat + "\n";
				if (card.types.indexOf("Monster") > -1) {
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
					if (messageMode & 0x1) {
						out += "Type: " + typesStr + " Attribute: " + addEmote(card.attribute, "|")[0] + "\n";
					} else {
						out += "**Type**: " + typesStr + " **Attribute**: " + addEmote(card.attribute, "|")[emoteMode] + "\n";
					}
					let lvName = "Level";
					if (card.types.indexOf("Xyz") > -1) {
						lvName = "Rank";
					} else if (card.types.indexOf("Link") > -1) {
						lvName = "Link Rating";
					}
					if (messageMode & 0x1) {
						out += lvName + ": " + card.level;
					} else {
						out += "**" + lvName + "**: " + card.level + " ";
					}
					if (emoteMode > 0) {
						if (messageMode & 0x1) {
							if (lvName == "Level") {
								out += "✪";
							} else if (lvName == "Rank") {
								out += "⍟";
							}
						} else {
							if (card.isType(0x1000000000)) { //is dark synchro
								out += emoteDB["NLevel"] + " ";
							} else {
								out += emoteDB[lvName] + " ";
							}
						}
					}
					out += " ";
					if (messageMode & 0x1) {
						out += "ATK: ";
					} else {
						out += "**ATK**: ";
					}
					out += card.atk + " ";
					if (card.def) {
						if (messageMode & 0x1) {
							out += "DEF: ";
						} else {
							out += "**DEF**: ";
						}
						out += card.def;
					} else {
						if (messageMode & 0x1) {
							out += "Link Markers: ";
						} else {
							out += "**Link Markers**: ";
						}
						out += card.markers;
					}
					if (card.types.indexOf("Pendulum") > -1) {
						if (messageMode & 0x1) {
							out += " Pendulum Scale: ";
						} else {
							out += " **Pendulum Scale**: ";
						}
						if (emoteMode > 0) {
							if (messageMode & 0x1) {
								out += "←" + card.lscale + "/" + card.rscale + "→ ";
							} else {
								out += " " + card.lscale + emoteDB["L.Scale"] + " " + emoteDB["R.Scale"] + card.rscale + " ";
							}
						} else {
							out += card.lscale + "/" + card.rscale;
						}
					}
					out += "\n";
					out += quo + quo + quo + quo + quo + quo;
				} else if (card.types.indexOf("Spell") > -1 || card.types.indexOf("Trap") > -1) {
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
						if (messageMode & 0x1) {
							out += "Type: " + typesStr + " Attribute: " + addEmote(card.attribute, "|")[0] + "\n";
							out += "Level: " + card.level;
						} else {
							out += "**Type**: " + typesStr + " **Attribute**: " + addEmote(card.attribute, "|")[emoteMode] + "\n";
							out += "**Level**: " + card.level;
						}
						if (emoteMode > 0) {
							if (messageMode & 0x1) {
								out += "✪";
							} else {
								out += " " + emoteDB["Level"];
							}
						}
						if (messageMode & 0x1) {
							out += " " + " ATK: " + convertStat(card.atk) + " DEF: " + convertStat(card.def) + "\n";
						} else {
							out += " " + " **ATK**: " + convertStat(card.atk) + " **DEF**: " + convertStat(card.def) + "\n";
						}
					} else {
						if (messageMode & 0x1) {
							out += "Type: " + typeemote[0] + "\n";
						} else {
							out += "**Type**: " + typeemote[emoteMode] + "\n";
						}
					}
				}
				break;
			case "effect":
				out += "__**" + quo + card.name + quo + "**__" + (messageMode & 0x1 && " " || "\n");
				if (card.types.indexOf("Monster") > -1) {
					let cardText = card.desc;
					let textName = "Monster Effect";
					if (card.types.indexOf("Normal") > -1) {
						textName = "Flavour Text";
					}
					if (cardText.length === 4) {
						if (messageMode & 0x1) {
							out += cardText[0] + "``` ``" + cardText[2] + "``\n" + "```" + cardText[1] + "`````" + cardText[3] + "``";
						} else {
							out += "**" + cardText[2] + "**: " + cardText[0] + "\n";
							out += "**" + cardText[3] + "**: " + cardText[1];
						}
					} else {
						if (messageMode & 0x1) {
							out += cardText[0] + "``` ``" + textName + "``";
						} else {
							out += "**" + textName + "**: " + cardText[0];
						}
					}
				} else if (card.types.indexOf("Spell") > -1 || card.types.indexOf("Trap") > -1) {
					if (messageMode & 0x1) {
						out += "``````" + card.desc[0].replace(/\n/g, "\n") + "``` ``Effect``\n";
					} else {
						out += "**Effect**: " + card.desc[0].replace(/\n/g, "\n");
					}
				} else {
					if (messageMode & 0x1) {
						out += "``````" + card.desc[0].replace(/\n/g, "\n") + "``` ``Card Text``\n";
					} else {
						out += "**Card Text**: " + card.desc[0].replace(/\n/g, "\n");
					}
				}
				break;
			default:
				return;
		}
		if (out.length > 0) {
			if (messageMode & 0x2) {
				bot.sendMessage({
					to: channelID,
					embed: {
						color: embedColor,
						description: out,
					}
				});
			} else {
				bot.sendMessage({
					to: channelID,
					message: out
				});
			}
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
	https.get(url.parse(deckUrl), function(response) {
		let data = [];
		response.on('data', function(chunk) {
			data.push(chunk);
		}).on('end', async function() {
			let buffer = Buffer.concat(data);
			let deckString = buffer.toString();
			let mainDeck = sliceBetween(deckString, "#main", "#extra").split("\r\n");
			let extraDeck = sliceBetween(deckString, "#extra", "!side").split("\r\n");
			let sideDeck = deckString.split("!side")[1] && deckString.split("!side")[1].split("\r\n");
			let mainArr = [];
			let extraArr = [];
			let sideArr = [];
			for (let card of mainDeck) {
				let car = cards[outLang][parseInt(card)];
				if (car) {
					mainArr.push(car.name);
				}
			}
			for (let card of extraDeck) {
				let car = cards[outLang][parseInt(card)];
				if (car) {
					extraArr.push(car.name);
				}
			}
			if (sideDeck) {
				for (let card of sideDeck) {
					let car = cards[outLang][parseInt(card)];
					if (car) {
						sideArr.push(car.name);
					}
				}
			}
			if (mainArr.length + extraArr.length + sideArr.length === 0) {
				return;
			}
			let out = "";
			if (mainArr.length > 0) {
				let mainCount = arrayCount(mainArr); //gets an object with array properties and the number of times that property appears
				out += "**" + quo + "Main Deck" + quo + "**\n" + bo + quo + quo + quo;
				Object.keys(mainCount).forEach(function(key, index) {
					out += mainCount[key] + " " + key + "\n";
				});
				out += quo + quo + quo + bo + (messageMode & 0x1 && " " || "");
			}
			if (extraArr.length > 0) {
				let extraCount = arrayCount(extraArr);
				out += "**" + quo + "Extra Deck" + quo + "**\n" + bo + quo + quo + quo;
				Object.keys(extraCount).forEach(function(key, index) {
					out += extraCount[key] + " " + key + "\n";
				});
				out += quo + quo + quo + bo + (messageMode & 0x1 && " " || "");
			}
			if (sideArr.length > 0) {
				let sideCount = arrayCount(sideArr);
				out += "**" + quo + "Side Deck" + quo + "**\n" + bo + quo + quo + quo;
				Object.keys(sideCount).forEach(function(key, index) {
					out += sideCount[key] + " " + key + "\n";
				});
				out += quo + quo + quo + bo + (messageMode & 0x1 && " " || "");
			}
			if (out.length > 0) {
				let outArr = out.match(/[\s\S]{1,2000}/g); //splits text into 2k character chunks
				for (let msg of outArr) {
					if (messageMode & 0x2) {
						bot.sendMessage({
							to: userID,
							embed: {
								color: embedColor,
								description: out,
							}
						});
					} else {
						bot.sendMessage({
							to: userID,
							message: out
						});
					}
				}
			}
		});
	});
}

function getCardScript(card, user, userID, channelID, message, event) {
	return new Promise(function(resolve, reject) {
		let scriptUrl = scriptUrlMaster;
		let ot = card.ot;
		if (["Anime", "Illegal", "Video Game"].indexOf(ot) > -1) {
			scriptUrl = scriptUrlAnime;
		}
		if (ot === "Custom") {
			scriptUrl = scriptUrlCustom;
		}
		let fullUrl = scriptUrl + "c" + card.code + ".lua";
		if (debugOutput) {
			console.log("Debug data: " + fullUrl);
			console.dir(url.parse(fullUrl));
		}
		https.get(url.parse(fullUrl), function(response) {
			let data = [];
			response.on('data', function(chunk) {
				data.push(chunk);
			}).on('end', async function() {
				let buffer = Buffer.concat(data);
				let script = buffer.toString();
				if (script === "404: Not Found\n" && scriptUrlBackup) {
					script = await new Promise(function(resolve, reject) {
						fullUrl = scriptUrlBackup + "c" + card.code + ".lua";
						https.get(url.parse(fullUrl), function(response) {
							let data2 = [];
							response.on('data', function(chunk) {
								data2.push(chunk);
							}).on('end', async function() {
								let buffer2 = Buffer.concat(data2);
								let script2 = buffer2.toString();
								resolve(script2);
							});
						});
					});
				}
				let scriptArr = script.split("\n");
				script = "";
				scriptArr.forEach(function(key, index) {
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
		if (messageMode & 0x2) {
			bot.sendMessage({
				to: channelID,
				embed: {
					color: embedColor,
					description: bo + quo + "No matches found!" + quo + bo,
				}
			});
		} else {
			bot.sendMessage({
				to: channelID,
				message: bo + quo + "No matches found!" + quo + bo
			});
		}
	} else {
		let out = bo + quo + "Top 10 card name matches for" + quo + bo + " **`" + arg + "`**:";
		out += bo + quo + quo + quo;
		let i = 0;
		let outs = [];
		while (results[i] && outs.length < 10) {
			let card = cards[outLang][results[i].item.id];
			if (card) {
				if (aliasCheck(card, outLang) && (!args || randFilterCheck(results[i].item.id, args, outLang))) {
					outs.push("\n" + (outs.length + 1) + ". " + results[i].item.name);
				}
			}
			i++;
		}
		for (let o of outs) {
			out += o;
		}
		out += quo + quo + quo + bo;
		if (messageMode & 0x2) {
			bot.sendMessage({
				to: channelID,
				embed: {
					color: embedColor,
					description: out,
				}
			});
		} else {
			bot.sendMessage({
				to: channelID,
				message: out
			});
		}
	}
}

function set(user, userID, channelID, message, event, name) {
	let arg = message.slice((pre + name + " ").length);
	if (arg.toLowerCase() in setcodes) {
		if (messageMode & 0x2) {
			bot.sendMessage({
				to: channelID,
				embed: {
					color: embedColor,
					description: bo + quo + quo + quo + jvex + setcodes[arg.toLowerCase()] + ": " + arg + quo + quo + quo + bo
				}
			});
		} else {
			bot.sendMessage({
				to: channelID,
				message: bo + quo + quo + quo + jvex + setcodes[arg.toLowerCase()] + ": " + arg + quo + quo + quo + bo
			});
		}
	} else {
		Object.keys(setcodes).forEach(function(key, index) {
			if (setcodes[key].toLowerCase() === arg.toLowerCase()) {
				if (messageMode & 0x2) {
					bot.sendMessage({
						to: channelID,
						embed: {
							color: embedColor,
							description: bo + quo + quo + quo + jvex + setcodes[key] + ": " + key + quo + quo + quo + bo
						}
					});
				} else {
					bot.sendMessage({
						to: channelID,
						message: bo + quo + quo + quo + jvex + setcodes[key] + ": " + key + quo + quo + quo + bo
					});
				}
				return;
			}
		});
	}
}

function searchSkill(user, userID, channelID, message, event, name) {
	let arg = message.toLowerCase().slice((pre + name + " ").length);
	let index = -1;
	skills.forEach(function(skill, ind) {
		if (arg === skill.name.toLowerCase()) {
			index = ind;
		}
	});
	if (index < 0) {
		let result = skillFuse.search(arg);
		if (result.length > 0) {
			skills.forEach(function(skill, ind) {
				if (result[0].item.name.toLowerCase() === skill.name.toLowerCase()) {
					index = ind;
				}
			});
		}
	}
	if (index > -1) {
		let skill = skills[index];
		let out = "";
		out += "__**" + quo + skill.name + quo + "**__" + (messageMode & 0x1 && " " || "\n");
		if (messageMode & 0x1) {
			out += "**```http\n" + skill.desc + "``` ``Effect`` ```css\n" + skill.chars + "``` ``Characters``**";
		} else {
			out += "**Effect**: " + skill.desc + "\n";
			out += "**Characters**: " + skill.chars;
		}
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
			Object.keys(strs).forEach(function(key, index) {
				if (messageMode & 0x1) {
					out += key + ": " + strs[key] + "\n";
				} else {
					out += key + ": `" + strs[key] + "`\n";
				}
			});
			if (messageMode & 0x2) {
				bot.sendMessage({
					to: channelID,
					embed: {
						color: embedColor,
						description: bo + quo + quo + quo + jvex + out + quo + quo + quo + bo
					}
				});
			} else {
				bot.sendMessage({
					to: channelID,
					message: bo + quo + quo + quo + jvex + out + quo + quo + quo + bo
				});
			}
		} else {
			let out = "No strings found for " + card.name + "!";
			if (messageMode & 0x2) {
				bot.sendMessage({
					to: channelID,
					embed: {
						color: embedColor,
						description: bo + quo + quo + quo + jvex + out + quo + quo + quo + bo
					}
				});
			} else {
				bot.sendMessage({
					to: channelID,
					message: bo + quo + quo + quo + jvex + out + quo + quo + quo + bo
				});
			}
		}
	}
}

function rulings(user, userID, channelID, message, event, name) {
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
	let jaCard;
	Object.keys(cards[rulingLang]).forEach(function(key, index) {
		if (cards[rulingLang][key].code === code) {
			jaCard = cards[rulingLang][key];
		}
	});
	let enName = enCard.name;
	let out = "";
	if (!jaCard) {
		out = "Sorry, I don't have a Japanese translation of \"" + enName + "\"!"
	} else {
		let jaName = jaCard.name;
		let jUrl = "https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=1&sess=1&keyword=" + jaName + "&stype=1&ctype=&starfr=&starto=&pscalefr=&pscaleto=&linkmarkerfr=&linkmarkerto=&atkfr=&atkto=&deffr=&defto=&othercon=2&request_locale=ja";
		out = "Rulings for `" + enName + "`: <" + encodeURI(jUrl) + ">\nClick the appropriate search result, then the yellow button that reads \"このカードのＱ＆Ａを表示\"";
	}
	if (messageMode & 0x2) {
		bot.sendMessage({
			to: channelID,
			embed: {
				color: embedColor,
				description: bo + quo + quo + quo + jvex + out + quo + quo + quo + bo
			}
		});
	} else {
		bot.sendMessage({
			to: channelID,
			message: bo + quo + quo + quo + jvex + out + quo + quo + quo + bo
		});
	}
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
		if (validTerms.indexOf(arg.toLowerCase()) > -1) {
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
		results.forEach(function(value, index) {
			switch (term) {
				case "terms":
					let tempOut = ranks[index] + ". `" + value + "` (" + stats[statsKey][value] + " times)\n";
					if (out.length + tempOut.length < 2000) {
						out += tempOut;
					}
					break;
				case "commands":
					let tempVal = value;
					if (tempVal.indexOf("search") < 0) {
						tempVal = "`" + pre + tempVal + "`";
					}
					let temOut = ranks[index] + ". " + tempVal + " (" + stats[statsKey][value] + " times)\n";
					if (out.length + temOut.length < 2000) {
						out += temOut;
					}
					break;
				case "cards":
				default:
					let card = cards[outLang][parseInt(value)];
					let title = card && card.name || value;
					let teOut = ranks[index] + ". " + title + " (" + stats[statsKey][value] + " times)\n";
					if (out.length + teOut.length < 2000) {
						out += teOut;
					}
			}
		});
		if (messageMode & 0x2) {
			bot.sendMessage({
				to: channelID,
				embed: {
					color: embedColor,
					description: bo + quo + quo + quo + jvex + out + quo + quo + quo + bo
				}
			});
		} else {
			bot.sendMessage({
				to: channelID,
				message: bo + quo + quo + quo + jvex + out + quo + quo + quo + bo
			});
		}
	}
}

//utility functions
function sendLongMessage(out, user, userID, channelID, message, event, typecolor, markdownno, code, outLang) { //called by most cases of replying with a message to split up card text if too long, thanks ra anime
	return new Promise(function(resolve, reject) {
		try {
			let tempcolor = embcDB && typecolor && embcDB[typecolor] || embedColor;
			let imgurl = "";
			if (code && outLang) {
				imgurl = imageUrlMaster;
				let card = cards[outLang][code]
				if (["Anime", "Illegal", "Video Game"].indexOf(card.ot) > -1) {
					imgurl = imageUrlAnime;
				}
				if (card.ot === "Custom") {
					imgurl = imageUrlCustom;
				}
				imgurl += code + "." + imageExt;
			}
			if (out.length > 2000) {
				let outArr = [out.slice(0, 2000 - markdownno - 5 - longStr.length) + quo + quo + quo + bo + longStr, out.slice(2000 - markdownno - 5 - longStr.length)];
				longMsg = outArr[1];
				if (messageMode & 0x2) {
					bot.sendMessage({
						to: channelID,
						embed: {
							color: tempcolor,
							description: outArr[0],
							thumbnail: {
								url: imgurl
							},
						}
					}, function(err, res) {
						if (err) {
							if (err.response && err.response.retry_after) {
								setTimeout(function() {
									bot.sendMessage({
										to: channelID,
										embed: {
											color: tempcolor,
											description: out,
											thumbnail: {
												url: imgurl
											},
										}
									}, function(err, res) {
										if (err) {
											reject(err);
										} else {
											resolve(res);
										}
									});
								}, err.response.retry_after + 1)
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
					}, function(err, res) {
						if (err) {
							if (err.response && err.response.retry_after) {
								setTimeout(function() {
									bot.sendMessage({
										to: channelID,
										message: out
									}, function(err, res) {
										if (err) {
											reject(err);
										} else {
											resolve(res);
										}
									});
								}, err.response.retry_after + 1)
							} else {
								reject(err);
							}
						} else {
							resolve(res);
						}
					});
				}
			} else {
				if (messageMode & 0x2) {
					bot.sendMessage({
						to: channelID,
						embed: {
							color: tempcolor,
							description: out,
							thumbnail: {
								url: imgurl
							},
						}
					}, function(err, res) {
						if (err) {
							if (err.response && err.response.retry_after) {
								setTimeout(function() {
									bot.sendMessage({
										to: channelID,
										embed: {
											color: tempcolor,
											description: out,
											thumbnail: {
												url: imgurl
											},
										}
									}, function(err, res) {
										if (err) {
											reject(err);
										} else {
											resolve(res);
										}
									});
								}, err.response.retry_after + 1)
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
					}, function(err, res) {
						if (err) {
							if (err.response && err.response.retry_after) {
								setTimeout(function() {
									bot.sendMessage({
										to: channelID,
										message: out
									}, function(err, res) {
										if (err) {
											reject(err);
										} else {
											resolve(res);
										}
									});
								}, err.response.retry_after + 1)
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
		if (["Spell", "Trap", "Fusion", "Ritual", "Synchro", "Token", "Xyz", "Link"].indexOf(type) > -1) {
			ct = type;
		}
		if (!ct && ["Normal", "Effect"].indexOf(type) > -1) {
			ct = type;
		}
	}
	if (card.isType(0x1000000000)) {
		embCT = "Dark Synchro";
	}
	return ct;
}

function nameCheck(line, inLang) { //called by card searching functions to determine if fuse is needed and if so use it
	if (!inLang in dbs) {
		inLang = defaultLang;
	}
	for (let key of Object.keys(cards[inLang])) { //check all entries for exact name
		if (cards[inLang][key].name.toLowerCase() === line.toLowerCase()) {
			return cards[inLang][key].code;
		}
	}
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
		let newLine = lineArr.join(" ");
		for (let key of Object.keys(cards[inLang])) { //check all entries for exact name
			if (cards[inLang][key].name.toLowerCase() === line.toLowerCase()) {
				return cards[inLang][key].code;
			}
		}
		let result = fuse[inLang].search(newLine);
		if (result.length < 1) {
			return -1;
		} else {
			for (let res of result) {
				let card = cards[inLang][res.item.id];
				if (["Anime", "Video Game", "Illegal"].indexOf(card.ot) > -1) {
					res.score = res.score * 1.2; //weights score by status. Lower is better so increasing it makes official take priority.
				} else if (card.ot === "Custom") {
					res.score = res.score * 1.4;
				}
			}
			result.sort(compareFuseObj);
			let outCode;
			for (let key of Object.keys(cards[inLang])) { //check all entries for exact name
				if (cards[inLang][key].name.toLowerCase() === result[0].item.name.toLowerCase()) {
					outCode = cards[inLang][key].code;
				}
			}
			return outCode;
		}
	} else {
		let result = fuse[inLang].search(line);
		if (result.length < 1) {
			return -1;
		} else {
			for (let res of result) {
				let card = cards[inLang][res.item.id];
				if (["Anime", "Video Game", "Illegal"].indexOf(card.ot) > -1) {
					res.score = res.score * 1.2; //weights score by status. Lower is better so increasing it makes official take priority.
				} else if (card.ot === "Custom") {
					res.score = res.score * 1.4;
				}
			}
			result.sort(compareFuseObj);
			let outCode;
			for (let key of Object.keys(cards[inLang])) { //check all entries for exact name
				if (cards[inLang][key].name.toLowerCase() === result[0].item.name.toLowerCase()) {
					outCode = cards[inLang][key].code;
				}
			}
			return outCode;
		}
	}
}

function addEmote(args, symbol) {
	let str = args.join(symbol);
	let emotes = "";
	if (emoteMode > 0) {
		for (let i = 0; i < args.length; i++) {
			emotes += emoteDB[args[i]]
		}
	}
	return [str, emotes, str + " " + emotes];
}

function randFilterCheck(code, args, outLang) {
	let otFilters = [];
	let typeFilters = [];
	let raceFilters = [];
	let attFilters = [];
	let lvFilters = [];
	let lscaleFilters = [];
	let rscaleFilters = [];
	let scaleFilters = [];
	let atkFilters = [];
	let defFilters = [];
	let numFilters = [];
	let setFilters = [];
	let argStr = args.join(" ");
	for (let status of Card.otList) {
		if (argStr.indexOf("status:" + status) > -1 || argStr.indexOf("ot:" + status) > -1) {
			otFilters.push(status);
		}
	}
	for (let type of Card.typeList) {
		if (argStr.indexOf("type:" + type) > -1) {
			typeFilters.push(type);
		}
	}
	for (let race of Card.raceList) { //this is all weird to distinguish between Beast and Beast-Warrior -.-
		let r1 = "race:" + race;
		let r2 = "mtype:" + race;
		let indicies = [];
		for (let i = 0; i < argStr.length; i++) {
			if (argStr.slice(i, i + r1.length) === r1) {
				if (Card.raceConflicts[race]) {
					let c = "race:" + Card.raceConflicts[race];
					if (!(argStr.slice(i, i + c.length) === c)) {
						indicies.push(i);
					}
				} else {
					indicies.push(i);
				}
			} else if (argStr.slice(i, i + r2.length) === r2) {
				if (Card.raceConflicts[race]) {
					let c = "mtype:" + Card.raceConflicts[race];
					if (!(argStr.slice(i, i + c.length) === c)) {
						indicies.push(i);
					}
				} else {
					indicies.push(i);
				}
			}
		}
		if (indicies.length > 0) {
			raceFilters.push(race);
		}
	}
	for (let att of Card.attributeList) {
		if (argStr.indexOf("attribute:" + att) > -1 || argStr.indexOf("att:" + att) > -1) {
			attFilters.push(att);
		}
	}
	for (let set of Card.setList) {
		if (argStr.indexOf("set:" + set) > -1 || argStr.indexOf("archetype:" + set) > -1) {
			setFilters.push(set);
		}
	}
	for (let arg of args) {
		let argTxt = arg.split(":")[1]
		let argNum = parseInt(argTxt);
		if (isNaN(argNum)) {
			if (arg.startsWith("atk:") && argTxt === "?") {
				atkFilters.push(argTxt); //atk/def are strings for consistency because "?" is an option
			} else if (arg.startsWith("def:") && argTxt === "?") {
				defFilters.push(argTxt);
			}
		} else {
			if (arg.startsWith("level:")) {
				lvFilters.push(argNum);
			} else if (arg.startsWith("lscale:")) {
				lscaleFilters.push(argNum);
			} else if (arg.startsWith("rscale:")) {
				rscaleFilters.push(argNum);
			} else if (arg.startsWith("scale:")) {
				scaleFilters.push(argNum);
			} else if (arg.startsWith("atk:")) {
				atkFilters.push(argTxt); //atk/def are strings for consistency because "?" is an option
			} else if (arg.startsWith("def:")) {
				defFilters.push(argTxt);
			}
		}
	}
	if (otFilters.length + typeFilters.length + raceFilters.length + attFilters.length + lvFilters.length + lscaleFilters.length + rscaleFilters.length + scaleFilters.length + atkFilters.length + defFilters.length + setFilters.length === 0) {
		return true;
	} else {
		let card = cards[outLang][code];
		let boo = true;
		if (otFilters.length > 0 && otFilters.indexOf(card.ot.toLowerCase()) === -1) {
			boo = false;
		}
		if (typeFilters.length > 0) {
			let subBoo = false;
			for (let type of card.allTypes) {
				if (typeFilters.indexOf(type.toLowerCase()) > -1) {
					subBoo = true;
				}
			}
			boo = boo && subBoo;
		}
		if (raceFilters.length > 0) {
			let subBoo = false;
			for (let rac of card.race) {
				if (raceFilters.indexOf(rac.toLowerCase()) > -1) {
					subBoo = true;
				}
			}
			boo = boo && subBoo;
		}
		if (attFilters.length > 0) {
			let subBoo = false;
			for (let att of card.attribute) {
				if (attFilters.indexOf(att.toLowerCase()) > -1) {
					subBoo = true;
				}
			}
			boo = boo && subBoo;
		}
		if (setFilters.length > 0) {
			let subBoo = false;
			if (card.sets) {
				for (let set of card.sets) {
					if (setFilters.indexOf(set.toLowerCase()) > -1) {
						subBoo = true;
					}
				}
			}

			boo = boo && subBoo;
		}
		if (lvFilters.length > 0 && lvFilters.indexOf(card.level) === -1) {
			boo = false;
		}
		if (lscaleFilters.length > 0 && lscaleFilters.indexOf(card.lscale) === -1) {
			boo = false;
		}
		if (rscaleFilters.length > 0 && rscaleFilters.indexOf(card.rscale) === -1) {
			boo = false;
		}
		if (scaleFilters.length > 0 && scaleFilters.indexOf(card.lscale) === -1 && scaleFilters.indexOf(card.rscale) === -1) {
			boo = false;
		}
		if (atkFilters.length > 0 && atkFilters.indexOf(card.atk) === -1) {
			boo = false;
		}
		if (defFilters.length > 0 && defFilters.indexOf(card.def) === -1) {
			boo = false;
		}
		return boo;
	}
}

function aliasCheck(card, outLang) { //called when getting alt arts, checks if an aliased card has the same OT as the original
	let alias = card.alias;
	if (alias === 0) {
		return true;
	}
	let alCard = cards[outLang][alias];
	return card.ot !== alCard.ot;
}

function getBaseID(card, inLang) {
	let alias = card.alias;
	let alCode = card.code;
	if (alias === 0) {
		return alCode;
	}
	let baseCard = cards[inLang][alias];
	if (card.ot === baseCard.ot && card.name == baseCard.name) {
		return baseCard.code;
	} else {
		return alCode;
	}
}

function sliceBetween(str, cha1, cha2) {
	return str.slice(str.indexOf(cha1) + cha1.length, str.indexOf(cha2));
}

function getIncInt(min, max) { //get random inclusive integer
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

function arrayCount(arr) {
	return arr.reduce(function(prev, cur) {
		prev[cur] = (prev[cur] || 0) + 1;
		return prev;
	}, {});
}

//games
function trivia(user, userID, channelID, message, event) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	if (channelID in gameData || (triviaLocks[serverID] && triviaLocks[serverID].indexOf(channelID) === -1)) {
		return;
	} else {
		let outLang = defaultLang;
		let args = message.toLowerCase().split(" ");
		for (let arg of args) {
			if (arg in dbs) {
				outLang = arg;
			}
		}
		let round = 1;
		for (let arg of args) {
			if (parseInt(arg) > round) {
				if (parseInt(arg) > triviaMaxRounds) {
					round = triviaMaxRounds;
				} else {
					round = parseInt(arg);
				}
			}
		}
		let hard = (args.indexOf("hard") > -1);
		startTriviaRound(round, hard, outLang, user, userID, channelID, message, event);
	}
}

async function startTriviaRound(round, hard, outLang, user, userID, channelID, message, event) {
	try {
		//pick a random card
		let code;
		let buffer;
		let name;
		let card;
		let args = message.toLowerCase().split(" ");
		let argStr = args.join(" ");
		let otFilters = [];
		for (let status of Card.otList) {
			if (argStr.indexOf("status:" + status) > -1 || argStr.indexOf("ot:" + status) > -1) {
				otFilters.push(status);
			}
		}
		if (otFilters.length === 0) {
			args.push("ot:tcg/ocg");
		}
		let ids = Object.keys(cards[outLang]);
		let matches = [];
		if (args.length > 1) {
			for (let id of ids) { //gets a list of all cards that meet specified critera, before getting a random one of those cards
				if (randFilterCheck(id, args, outLang) && cards[outLang][id].name.indexOf("(Anime)") === -1) { //a number of filters can be specified in the command, and this checks that a card meets them
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
			let stat = card.ot;
			if (["Anime", "Illegal", "Video Game"].indexOf(stat) > -1) {
				imageUrl = imageUrlAnime;
			}
			if (stat === "Custom") {
				imageUrl = imageUrlCustom;
			}
			buffer = await new Promise(function(resolve, reject) {
				if (debugOutput) {
					console.log("Debug Data: " + imageUrl + code + "." + imageExt);
					console.dir(url.parse(imageUrl + code + "." + imageExt));
				}
				https.get(url.parse(imageUrl + code + "." + imageExt), function(response) {
					let data = [];
					response.on('data', function(chunk) {
						data.push(chunk);
					}).on('end', async function() {
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
			} while (hintIs.indexOf(ind) > -1 && nameArr[ind] !== " ");
			hintIs.push(ind);
		}
		let hint = "";
		nameArr.forEach(function(key, index) {
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
				"lock": false
			}
		}
		if (hard) {
			buffer = await hardCrop(buffer, user, userID, channelID, message, event);
		}
		bot.uploadFile({
			to: channelID,
			file: buffer,
			filename: code + "." + imageExt
		}, function(err, res) {
			if (err) {
				console.log(err);
			} else {
				if (messageMode & 0x2) {
					bot.sendMessage({
						to: channelID,
						embed: {
							color: 0x00ff00,
							description: bo + quo + "Can you name this card? Time remaining:" + quo + " `" + triviaTimeLimit / 1000 + "`" + bo,
						}
					}, function(err, res) {
						if (err) {
							console.log(err);
						} else {
							let messageID = res.id;
							let i = triviaTimeLimit / 1000 - 1;
							//let tempcolor = parseInt("0x" + red + green + "00");
							gameData[channelID].IN = setInterval(function() {
								let green = Math.floor(0xff * (i * 1000 / triviaTimeLimit)).toString("16").padStart(2, "0").replace(/0x/, "");
								let red = Math.floor(0xff * (1 - (i * 1000 / triviaTimeLimit))).toString("16").padStart(2, "0").replace(/0x/, "");
								let tempcolor = parseInt("0x" + red + green + "00");
								if (messageMode & 0x2) {
									bot.editMessage({
										channelID: channelID,
										messageID: messageID,
										embed: {
											color: tempcolor,
											description: bo + quo + "Can you name this card? Time remaining:" + quo + " `" + i + "`" + bo,
										}
									});
									tempcolor += 0x300 - 0x1000
								} else {
									bot.editMessage({
										channelID: channelID,
										messageID: messageID,
										message: bo + quo + "Can you name this card? Time remaining:" + quo + " `" + i + "`" + bo
									});
								}
								i--;
							}, 1000);
						}
					});
				} else {
					bot.sendMessage({
						to: channelID,
						message: bo + quo + "Can you name this card? Time remaining:" + quo + " `" + triviaTimeLimit / 1000 + "`" + bo
					}, function(err, res) {
						if (err) {
							console.log(err);
						} else {
							let messageID = res.id;
							let i = triviaTimeLimit / 1000 - 1;
							//let tempcolor = 0x6AFF3D;
							gameData[channelID].IN = setInterval(function() {
								if (messageMode & 0x2) {
									let green = Math.floor(0xff * (i * 1000 / triviaTimeLimit)).toString("16").padStart(2, "0").replace(/0x/, "");
									let red = Math.floor(0xff * (1 - (i * 1000 / triviaTimeLimit))).toString("16").padStart(2, "0").replace(/0x/, "");
									let tempcolor = parseInt("0x" + red + green + "00");
									bot.editMessage({
										channelID: channelID,
										messageID: messageID,
										embed: {
											color: tempcolor,
											description: bo + quo + "Can you name this card? Time remaining:" + quo + " `" + i + "`" + bo
										}
									});
								} else {
									bot.editMessage({
										channelID: channelID,
										messageID: messageID,
										message: bo + quo + "Can you name this card? Time remaining:" + quo + " `" + i + "`" + bo
									});
								}
								i--;
							}, 1000);
						}
					});
				}
				gameData[channelID].TO1 = setTimeout(function() {
					if (messageMode & 0x2) {
						bot.sendMessage({
							to: channelID,
							embed: {
								color: embedColor,
								description: bo + quo + "Have a hint:" + quo + " `" + gameData[channelID].hint + "`" + bo,
							}
						});
					} else {
						bot.sendMessage({
							to: channelID,
							message: bo + quo + "Have a hint:" + quo + " `" + gameData[channelID].hint + "`" + bo
						});
					}
				}, triviaHintTime);
				let out = bo + quo + "Time's up! The card was" + quo + bo + " **" + gameData[channelID].name + "**" + bo + quo + "!" + quo + bo + "\n";
				if (Object.keys(gameData[channelID].score).length > 0) {
					out += "**Scores**:\n" + bo + quo + quo + quo + jvex;
					Object.keys(gameData[channelID].score).forEach(function(key, index) {
						out += bot.users[key].username + ": " + gameData[channelID].score[key] + "\n";
					});
					out += quo + quo + quo + bo;
				}
				gameData[channelID].TO2 = setTimeout(function() {
					if (gameData[channelID.lock]) {
						return;
					}
					gameData[channelID].lock = true;
					if (messageMode & 0x2) {
						bot.sendMessage({
							to: channelID,
							embed: {
								color: embedColor,
								description: out,
							}
						});
					} else {
						bot.sendMessage({
							to: channelID,
							message: out
						});
					}
					if (gameData[channelID].IN) {
						clearInterval(gameData[channelID].IN);
					}
					startTriviaRound(gameData[channelID].round, gameData[channelID].hard, gameData[channelID].lang, user, userID, channelID, message, event);
				}, triviaTimeLimit);
			}
		});
	} catch (e) {
		console.log(e);
	}
}

function hardCrop(buffer, user, userID, channelID, message, event) {
	return new Promise(function(resolve, reject) {
		jimp.read(buffer, function(err, image) {
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
				image.getBuffer(jimp.AUTO, function(err, res) {
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
	if (message.toLowerCase().startsWith(pre + "tq")) {
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
		out = "<@" + userID + "> " + bo + quo + "quit the game. The answer was" + quo + bo + " **" + gameData[channelID].name + "**!\n"
		if (Object.keys(gameData[channelID].score).length > 0) {
			out += "\n**Scores**:\n" + bo + quo + quo + quo + jvex;
			Object.keys(gameData[channelID].score).forEach(function(key, index) {
				out += bot.users[key].username + ": " + gameData[channelID].score[key] + "\n";
			});
			out += quo + quo + quo + bo;
		}
		if (Object.keys(gameData[channelID].score).length > 0) {
			let winners = [];
			Object.keys(gameData[channelID].score).forEach(function(key, index) {
				if (index === 0 || gameData[channelID].score[key] > gameData[channelID].score[winners[0]]) {
					winners = [key];
				} else if (gameData[channelID].score[key] === gameData[channelID].score[winners[0]]) {
					winners.push(key);
				}
			});
			if (winners.length > 1) {
				out += bo + quo + "It was a tie! The winners are " + quo + bo + "<@" + winners.join(">, <@") + ">!";
			} else {
				out += bo + quo + "The winner is " + quo + bo + "<@" + winners + ">!";
			}
		}
		if (messageMode & 0x2) {
			bot.sendMessage({
				to: channelID,
				embed: {
					color: embedColor,
					description: out,
				}
			});
		} else {
			bot.sendMessage({
				to: channelID,
				message: out
			});
		}
		delete gameData[channelID];
	} else if (message.toLowerCase().startsWith(pre + "tskip")) {
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
		out = "<@" + userID + "> " + bo + quo + "skipped the round! The answer was" + quo + bo + " **" + gameData[channelID].name + "**!\n";
		if (Object.keys(gameData[channelID].score).length > 0) {
			out += "**Scores**:\n" + bo + quo + quo + quo + jvex;
			Object.keys(gameData[channelID].score).forEach(function(key, index) {
				out += bot.users[key].username + ": " + gameData[channelID].score[key] + "\n";
			});
			out += quo + quo + quo + bo;
		}
		if (messageMode & 0x2) {
			bot.sendMessage({
				to: channelID,
				embed: {
					color: embedColor,
					description: out,
				}
			});
		} else {
			bot.sendMessage({
				to: channelID,
				message: out
			});
		}
		startTriviaRound(gameData[channelID].round, gameData[channelID].hard, gameData[channelID].lang, user, userID, channelID, message, event);
	} else if (message.toLowerCase().indexOf(gameData[channelID].name.toLowerCase()) > -1) {
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
		bot.addReaction({
			channelID: channelID,
			messageID: event.d.id,
			reaction: thumbsup
		});
		out = "<@" + userID + ">" + bo + quo + " got it! The answer was" + quo + bo + " **" + gameData[channelID].name + "**!\n";
		if (gameData[channelID].score[userID]) {
			gameData[channelID].score[userID]++;
		} else {
			gameData[channelID].score[userID] = 1;
		}
		if (Object.keys(gameData[channelID].score).length > 0) {
			out += "**Scores**:\n" + bo + quo + quo + quo + jvex;
			Object.keys(gameData[channelID].score).forEach(function(key, index) {
				out += bot.users[key].username + ": " + gameData[channelID].score[key] + "\n";
			});
			out += quo + quo + quo + bo;
		}
		if (gameData[channelID].round === 1) {
			if (messageMode & 0x1) {
				out += " ";
			}
			out += bo + quo + "The game is over! " + quo + bo;
			if (Object.keys(gameData[channelID].score).length > 0) {
				let winners = [];
				Object.keys(gameData[channelID].score).forEach(function(key, index) {
					if (index === 0 || gameData[channelID].score[key] > gameData[channelID].score[winners[0]]) {
						winners = [key];
					} else if (gameData[channelID].score[key] === gameData[channelID].score[winners[0]]) {
						winners.push(key);
					}
				});
				if (messageMode & 0x1) {
					out += " ";
				}
				if (winners.length > 1) {
					out += bo + quo + "It was a tie! The winners are " + quo + bo + "<@" + winners.join(">, <@") + ">!";
				} else {
					out += bo + quo + "The winner is " + quo + bo + "<@" + winners + ">!";
				}
			}
			if (messageMode & 0x2) {
				bot.sendMessage({
					to: channelID,
					embed: {
						color: embedColor,
						description: out,
					}
				});
			} else {
				bot.sendMessage({
					to: channelID,
					message: out
				});
			}
			delete gameData[channelID];
		} else {
			if (messageMode & 0x2) {
				bot.sendMessage({
					to: channelID,
					embed: {
						color: embedColor,
						description: out,
					}
				});
			} else {
				bot.sendMessage({
					to: channelID,
					message: out
				});
			}
			startTriviaRound(gameData[channelID].ot, (gameData[channelID].round - 1), gameData[channelID].hard, gameData[channelID].lang, user, userID, channelID, message, event);
		}
	} else if (thumbsdown) {
		bot.addReaction({
			channelID: channelID,
			messageID: event.d.id,
			reaction: thumbsdown
		});
	}
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
				if (messageMode & 0x2) {
					bot.sendMessage({
						to: channelID,
						embed: {
							color: embedColor,
							description: "Trivia no longer locked to this channel!\nTrivia is locked to the following channels on this server: " + out.join(", ")
						}
					});
				} else {
					bot.sendMessage({
						to: channelID,
						message: "Trivia no longer locked to this channel!\nTrivia is locked to the following channels on this server: " + out.join(", ")
					});
				}
				config.triviaLocks = triviaLocks;
				fs.writeFileSync('config/config.json', JSON.stringify(config), 'utf8');
			} else {
				delete triviaLocks[serverID];
				if (messageMode & 0x2) {
					bot.sendMessage({
						to: channelID,
						embed: {
							color: embedColor,
							description: "Trivia no longer locked to any channel on this server!",
						}
					});
				} else {
					bot.sendMessage({
						to: channelID,
						message: "Trivia no longer locked to any channel on this server!"
					});
				}
				config.triviaLocks = triviaLocks;
				fs.writeFileSync('config/config.json', JSON.stringify(config), 'utf8');
			}
		} else {
			triviaLocks[serverID].push(channelID);
			let out = [];
			for (let lock of triviaLocks[serverID]) {
				out.push("<#" + lock + ">");
			}
			if (messageMode & 0x2) {
				bot.sendMessage({
					to: channelID,
					embed: {
						color: embedColor,
						description: "Trivia locked to this channel!\nTrivia is locked to the following channels on this server: " + out.join(", "),
					}
				});
			} else {
				bot.sendMessage({
					to: channelID,
					message: "Trivia locked to this channel!\nTrivia is locked to the following channels on this server: " + out.join(", ")
				});
			}
			config.triviaLocks = triviaLocks;
			fs.writeFileSync('config/config.json', JSON.stringify(config), 'utf8');
		}
	} else {
		triviaLocks[serverID] = [channelID];
		let out = [];
		for (let lock of triviaLocks[serverID]) {
			out.push("<#" + lock + ">");
		}
		if (messageMode & 0x2) {
			bot.sendMessage({
				to: channelID,
				embed: {
					color: embedColor,
					description: "Trivia locked to this channel!\nTrivia is locked to the following channels on this server: " + out.join(", "),
				}
			});
		} else {
			bot.sendMessage({
				to: channelID,
				message: "Trivia locked to this channel!\nTrivia is locked to the following channels on this server: " + out.join(", ")
			});
		}
		config.triviaLocks = triviaLocks;
		fs.writeFileSync('config/config.json', JSON.stringify(config), 'utf8');
	}
}

//permission handling
function _getPermissionArray(number) {
	let permissions = [];
	let binary = (number >>> 0).toString(2).split('');
	binary.forEach(function(bit, index) {
		if (bit == 0) {
			return;
		}
		Object.keys(Discord.Permissions).forEach(function(p) {
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

	bot.servers[serverID].members[userID].roles.concat([serverID]).forEach(function(roleID) {
		_getPermissionArray(bot.servers[serverID].roles[roleID].permissions).forEach(function(perm) {
			if (permissions.indexOf(perm) < 0) {
				permissions.push(perm);
			}
		});
	});

	Object.keys(bot.channels[channelID].permissions).forEach(function(overwrite) {
		if ((overwrite.type == 'member' && overwrite.id == userID) ||
			(overwrite.type == 'role' &&
				(bot.servers[serverID].members[userID].roles.indexOf(overwrite.id) > -1) ||
				serverID == overwrite.id)) {
			_getPermissionArray(overwrite.deny).forEach(function(denied) {
				let index = permissions.indexOf(denied);
				if (index > -1) {
					permissions.splice(index, 1);
				}
			});

			_getPermissionArray(overwrite.allow).forEach(function(allowed) {
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
	let forbidden = false;

	let permissions = getPermissions(userID, channelID);
	let forbiddenPerms = [];

	permissionValues.forEach(function(permission) {
		if ((permissions.indexOf(permission) < 0) && userID != bot.servers[serverID].owner_id) {
			forbidden = true;
			forbiddenPerms.push(permission);
		}
	});
	return !forbidden;
}

function servers(user, userID, channelID, message, event) {
	let out = "```\n";
	Object.keys(bot.servers).forEach(function(key, index) {
		out += bot.servers[key].name + "\t" + bot.servers[key].member_count + " members\n";
	});
	out += "```";
	if (messageMode & 0x2) {
		bot.sendMessage({
			to: userID,
			embed: {
				color: embedColor,
				description: out,
			}
		});
	} else {
		bot.sendMessage({
			to: userID,
			message: out
		});
	}
}

function updatejson(user, userID, channelID, message, event, name) {
	let arg = message.slice((pre + name + " ").length);
	let sheetID = sheetsDB[arg];
	if (!arg || !(/\S/.test(arg)) || !sheetID) { //if null or empty
		if (!sheetID)
			console.log(arg + ".json is not mapped.");
		return;
	}
	gstojson({
			spreadsheetId: sheetID,
		})
		.then(function(result) {
			fs.writeFileSync('dbs/' + arg + '.json', JSON.stringify(result), 'utf8');
			if (messageMode & 0x2) {
				bot.sendMessage({
					to: channelID,
					embed: {
						color: embedColor,
						description: bo + quo + arg + ".json updated successfully." + quo + bo,
					}
				});
			} else {
				bot.sendMessage({
					to: channelID,
					message: bo + quo + arg + ".json updated successfully." + quo + bo
				});
			}
			setJSON();
		})
		.catch(function(err) {
			console.log(err.message);
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
		if (func.name.toLowerCase().split("(")[0].indexOf(arg.toLowerCase()) > -1) {
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
		out += "[" + (i + 1) + "] " + line.sig.padStart(len, " ") + " | " + line.name + "\n"
	}
	out += "````Page: 1/" + pages.length + "`";
	if (messageMode & 0x2) {
		bot.sendMessage({
			to: channelID,
			embed: {
				color: embedColor,
				description: out,
			}
		}, function(err, res) {
			if (err) {
				console.log(err);
			} else {
				searchPage = {
					pages: pages,
					index: 0,
					user: userID,
					channel: channelID,
					search: "f",
					message: res.id,
					content: out,
					active: true
				};
			}
		});
	} else {
		bot.sendMessage({
			to: channelID,
			message: out
		}, function(err, res) {
			if (err) {
				console.log(err);
			} else {
				searchPage = {
					pages: pages,
					index: 0,
					user: userID,
					channel: channelID,
					search: "f",
					message: res.id,
					content: out,
					active: true
				};
			}
		});
	}
}

function searchConstants(user, userID, channelID, message, event, name) {
	let arg = message.slice((pre + name + " ").length);
	if (!arg || !(/\S/.test(arg))) { //if null or empty
		return;
	}
	let searched = [];
	for (let con of libConstants) {
		if (con.name.toLowerCase().indexOf(arg.toLowerCase()) > -1) {
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
		out += "[" + (i + 1) + "] " + line.val.toString().padStart(len, " ") + " | " + line.name + "\n"
	}
	out += "````Page: 1/" + pages.length + "`";
	if (messageMode & 0x2) {
		bot.sendMessage({
			to: channelID,
			embed: {
				color: embedColor,
				description: out,
			}
		}, function(err, res) {
			if (err) {
				console.log(err);
			} else {
				searchPage = {
					pages: pages,
					index: 0,
					user: userID,
					channel: channelID,
					search: "c",
					message: res.id,
					content: out,
					active: true
				};
			}
		});
	} else {
		bot.sendMessage({
			to: channelID,
			message: out
		}, function(err, res) {
			if (err) {
				console.log(err);
			} else {
				searchPage = {
					pages: pages,
					index: 0,
					user: userID,
					channel: channelID,
					search: "c",
					message: res.id,
					content: out,
					active: true
				};
			}
		});
	}
}

function searchParams(user, userID, channelID, message, event, name) {
	let arg = message.slice((pre + name + " ").length);
	if (!arg || !(/\S/.test(arg))) { //if null or empty
		return;
	}
	let searched = [];
	for (let par of libParams) {
		if (par.name.toLowerCase().indexOf(arg.toLowerCase()) > -1) {
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
		out += "[" + (i + 1) + "] " + line.type.padStart(len, " ") + " | " + line.name + "\n"
	}
	out += "````Page: 1/" + pages.length + "`";
	if (messageMode & 0x2) {
		bot.sendMessage({
			to: channelID,
			embed: {
				color: embedColor,
				description: out,
			}
		}, function(err, res) {
			if (err) {
				console.log(err);
			} else {
				searchPage = {
					pages: pages,
					index: 0,
					user: userID,
					channel: channelID,
					search: "p",
					message: res.id,
					content: out,
					active: true
				};
			}
		});
	} else {
		bot.sendMessage({
			to: channelID,
			message: out
		}, function(err, res) {
			if (err) {
				console.log(err);
			} else {
				searchPage = {
					pages: pages,
					index: 0,
					user: userID,
					channel: channelID,
					search: "p",
					message: res.id,
					content: out,
					active: true
				};
			}
		});
	}
}

function libPage(user, userID, channelID, message, event, name) {
	let arg = parseInt(message.slice((pre + name).length));
	if (userID !== searchPage.user || arg === NaN || arg > searchPage.pages.length) {
		return;
	}
	let index = arg - 1;
	let len = 0;
	let pages = searchPage.pages;
	let n = "sig";
	switch (searchPage.search) {
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
		out += "[" + (i + 1) + "] " + line[n].toString().padStart(len, " ") + " | " + line.name + "\n"
	}
	out += "````Page: " + arg + "/" + pages.length + "`";
	searchPage.index = index;
	searchPage.content = out;
	if (messageMode & 0x2) {
		bot.editMessage({
			channelID: searchPage.channel,
			messageID: searchPage.message,
			embed: {
				color: embedColor,
				description: out
			}
		});
	} else {
		bot.editMessage({
			channelID: searchPage.channel,
			messageID: searchPage.message,
			message: out
		});
	}
}

function libDesc(user, userID, channelID, message, event, name) {
	let arg = parseInt(message.slice((pre + name).length));
	if (userID !== searchPage.user || arg === NaN || arg > searchPage.pages[searchPage.index].length) {
		return;
	}
	let index = arg - 1;
	if (!searchPage.pages[searchPage.index][index]) {
		return;
	}
	let desc = searchPage.pages[searchPage.index][index].desc;
	if (desc.length === 0) {
		desc = "No description found for this entry.";
	}
	if (messageMode & 0x2) {
		bot.editMessage({
			channelID: searchPage.channel,
			messageID: searchPage.message,
			embed: {
				color: embedColor,
				description: searchPage.content + "\n`" + desc + "`"
			}
		});
	} else {
		bot.editMessage({
			channelID: searchPage.channel,
			messageID: searchPage.message,
			message: searchPage.content + "\n`" + desc + "`"
		});
	}
}