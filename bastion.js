let fs = require('fs');

let config = JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
if (!config.token) {
	console.log("No Discord user token found at config.token! Exiting...");
	exit();
}
let imagesEnabled = false;
let imageUrlMaster;
let imageUrlAnime;
let imageUrlCustom;
let imageSize = 100;
let triviaTimeLimit = 30000;
let triviaHintTime = 10000;
let triviaMaxRounds = 20;
let triviaLocks = {};
if (config.imageUrl) {
	imageUrlMaster = config.imageUrl;
	imagesEnabled = true;
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
} else {
	console.log("URL for image source not found at config.imageUrl! Image lookup and trivia will be disabled.");
}
let scriptsEnabled = false;
let scriptUrlMaster;
let scriptUrlAnime;
let scriptUrlCustom;
let scriptBackupEnabled = false;
let scriptUrlBackup;
if (config.scriptUrl) {
	scriptUrlMaster = config.scriptUrl;
	scriptsEnabled = true;
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
		scriptBackupEnabled = true;
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
	console.log("No prefix found at config.prefix! Defaulting to \"" + pre + "\"!")
}
let longStr = "...\n__Type \".long\" to be PMed the rest!__";
if (config.longStr) {
	longStr = config.longStr;
} else {
	console.log("No long message string found at config.longStr! Defaulting to \"" + longStr + "\"!");
}
let maxSearches = 3;
if (config.maxSearches) {
	maxSearches = config.maxSearches;
} else {
	console.log("No upper limit on searches in one message found at config.maxSearches! Defaulting to " + maxSearches + "!")
}
let dbs = {
	"en": ["cards.cdb"]
};
if (config.dbs) {
	dbs = config.dbs;
} else {
	console.log("List of card databases not found at config.dbs! Defaulting to one database named " + dbs.en[0] + ".");
}
let dbMemory = 33554432;
if (config.dbMemory) {
	dbMemory = config.dbMemory;
} else {
	console.log("Size of memory allocated for card databases not found at config.dbMemory! Defaulting to " + dbMemory + ".");
}
let owner;
let servLogEnabled = false;
if (config.botOwner) {
	servLogEnabled = true;
	owner = config.botOwner;
} else {
	console.log("Bot owner's ID not found at config.botOwner! Owner commands will be disabled.");
}
let libFuncEnabled = false;
let libFunctions;
let libConstEnabled = false;
let libConstants;
let libParamsEnabled = false;
let libParams;
if (config.scriptFunctions) {
	let path = "dbs/" + config.scriptFunctions;
	libFunctions = JSON.parse(fs.readFileSync(path, "utf-8"));
	libFuncEnabled = true;
} else {
	console.log("Path to function library not found at config.scriptFunctions! Function library will be disabled!");
}
if (config.scriptConstants) {
	let path = "dbs/" + config.scriptConstants;
	libConstants = JSON.parse(fs.readFileSync(path, "utf-8"));
	libConstEnabled = true;
} else {
	console.log("Path to constant library not found at config.scriptFunctions! Constant library will be disabled!");
}
if (config.scriptParams) {
	let path = "dbs/" + config.scriptParams;
	libParams = JSON.parse(fs.readFileSync(path, "utf-8"));
	libParamsEnabled = true;
} else {
	console.log("Path to parameter library not found at config.scriptFunctions! Parameter library will be disabled!");
}

let shortcuts = JSON.parse(fs.readFileSync('config/shortcuts.json', 'utf8'));
let setcodes = JSON.parse(fs.readFileSync('config/setcodes.json', 'utf8'));
/*an array of arrays that contain shortcuts for typing card names eg MST -> Mystical Space Typhoon
		[
			"mst",
			"Mystical Space Typhoon"
		],
		[
			"...",
			"...", //the arrays can have multiple shortcuts, only the last will be considered the full name
			"..."
		]
	]
if you don't care to include shortcuts, just make the contents of the JSON file a blank array, "[]"
*/
//discord setup
let Discord = require('discord.io');

let bot = new Discord.Client({
	token: config.token,
	autorun: true
});

bot.on('ready', function() {
	console.log('Logged in as %s - %s\n', bot.username, bot.id);
});

bot.on('disconnect', function() {
	console.log("Disconnected. Reconnecting...");
	bot.connect();
});

//sql setup
Module = {
	TOTAL_MEMORY: dbMemory
};
let SQL = require('sql.js');
let contents = {};
let names = {};
let ids = {};
let aliases = {};
let nameList = {};
let langs = [];
for (let lang in dbs) {
	console.log("loading " + lang + " database");
	langs.push(lang);
	let filebuffer = fs.readFileSync("dbs/" + dbs[lang][0]);
	let db = new SQL.Database(filebuffer);
	ids[lang] = [];
	aliases[lang] = [];
	nameList[lang] = [];
	contents[lang] = db.exec("SELECT * FROM datas");
	names[lang] = db.exec("SELECT * FROM texts");
	if (dbs[lang].length > 1) {
		for (let i = 1; i < dbs[lang].length; i++) {
			let newbuffer = fs.readFileSync("dbs/" + dbs[lang][i]);
			let newDB = new SQL.Database(newbuffer);
			let newContents = newDB.exec("SELECT * FROM datas");
			let newNames = newDB.exec("SELECT * FROM texts");
			for (let card of newContents[0].values) {
				contents[lang][0].values.push(card);
			}
			for (let card of newNames[0].values) {
				names[lang][0].values.push(card);
			}
		}
	}
	for (let card of contents[lang][0].values) { //populate ID list for easy checking of card validity
		ids[lang].push(card[0]);
		aliases[lang].push(card[2]);
	}
	for (let card of names[lang][0].values) { //populatre array of objects containing names for the sake of fuse
		nameList[lang].push({
			name: card[1],
			id: card[0]
		});
	}
}

//fuse setup
let Fuse = require('fuse.js');
let options = {
	shouldSort: true,
	includeScore: true,
	tokenize: true,
	threshold: 0.6,
	location: 0,
	distance: 100,
	maxPatternLength: 64,
	minMatchCharLength: 1,
	keys: [
		"name"
	]
};
let fuse = {}
for (let lang of langs) {
	fuse[lang] = new Fuse(nameList[lang], options);
}

let request = require('request');
let https = require('https');
let url = require('url');
let jimp = require('jimp');
let filetype = require('file-type');

let longMsg = "";
let gameData = {};

let searchPage = {
	active: false
};

bot.on('message', function(user, userID, channelID, message, event) {
	if (userID === bot.id) {
		return;
	}
	let lowMessage = message.toLowerCase();
	if (lowMessage.indexOf(pre + "randcard") === 0) {
		randomCard(user, userID, channelID, message, event);
		return;
	}
	if (scriptsEnabled && lowMessage.indexOf(pre + "script") === 0) {
		script(user, userID, channelID, message, event);
		return;
	}
	if (imagesEnabled && lowMessage.indexOf(pre + "trivia") === 0) {
		trivia(user, userID, channelID, message, event);
		return;
	}
	if (imagesEnabled && lowMessage.indexOf(pre + "tlock") === 0 && checkForPermissions(userID, channelID, [8192])) {
		tlock(user, userID, channelID, message, event);
		return;
	}
	if (lowMessage.indexOf(pre + "matches") === 0) {
		matches(user, userID, channelID, message, event);
		return;
	}
	if (lowMessage.indexOf(pre + "set") === 0) {
		set(user, userID, channelID, message, event);
		return;
	}
	if (lowMessage.indexOf(pre + "name") === 0) {
		getSingleProp("name", user, userID, channelID, message, event);
		return;
	}
	if (lowMessage.indexOf(pre + "id") === 0) {
		getSingleProp("id", user, userID, channelID, message, event);
		return;
	}
	if (lowMessage.indexOf(pre + "status") === 0) {
		getSingleProp("status", user, userID, channelID, message, event);
		return;
	}
	if (lowMessage.indexOf(pre + "price") === 0) {
		getSingleProp("price", user, userID, channelID, message, event);
		return;
	}
	if (lowMessage.indexOf(pre + "effect") === 0) {
		getSingleProp("effect", user, userID, channelID, message, event);
		return;
	}
	if (lowMessage.indexOf(pre + "peffect") === 0) {
		getSingleProp("peffect", user, userID, channelID, message, event);
		return;
	}
	if (lowMessage.indexOf(pre + "type") === 0) {
		getSingleProp("type", user, userID, channelID, message, event);
		return;
	}
	if (lowMessage.indexOf(pre + "att") === 0) {
		getSingleProp("att", user, userID, channelID, message, event);
		return;
	}
	if (lowMessage.indexOf(pre + "stats") === 0) {
		getSingleProp("stats", user, userID, channelID, message, event);
		return;
	}
	if (libFuncEnabled && lowMessage.indexOf(pre + "f") === 0) {
		searchFunctions(user, userID, channelID, message, event);
		return;
	}
	if (libConstEnabled && lowMessage.indexOf(pre + "c") === 0) {
		searchConstants(user, userID, channelID, message, event);
		return;
	}
	if (libParamsEnabled && lowMessage.indexOf(pre + "param") === 0) {
		searchParams(user, userID, channelID, message, event);
		return;
	}
	if (searchPage.active && lowMessage.indexOf(pre + "p") === 0 && lowMessage.indexOf("param") === -1) {
		libPage(user, userID, channelID, message, event);
		return;
	}
	if (searchPage.active && lowMessage.indexOf(pre + "d") === 0) {
		libDesc(user, userID, channelID, message, event);
		return;
	}
	if (servLogEnabled && userID === owner && lowMessage.indexOf(pre + "servers") === 0) {
		servers(user, userID, channelID, message, event);
		return;
	}
	if (message.indexOf("<@" + bot.id + ">") > -1 || lowMessage.indexOf(pre + "help") === 0) {
		help(user, userID, channelID, message, event);
	}
	if (longMsg.length > 0 && lowMessage.indexOf(pre + "long") === 0) {
		bot.sendMessage({
			to: userID,
			message: longMsg
		});
		return;
	}
	if (channelID in gameData) {
		switch (gameData[channelID].game) {
			case "trivia":
				answerTrivia(user, userID, channelID, message, event);
				break;
			default:
				break;
		}
		return;
	}
	let re = /{(.*?)}/g;
	let results = [];
	let regx;
	do {
		regx = re.exec(message);
		if (regx !== null) {
			if (regx[1].length > 0 && regx[1].indexOf(":") !== 0 && regx[1].indexOf("@") !== 0 && regx[1].indexOf("#") !== 0 && regx[1].indexOf("http") === -1) {
				results.push(regx[1]);
			}
		}
	} while (regx !== null);
	let results2 = [];
	if (imagesEnabled) {
		let re2 = /<(.*?)>/g;
		let regx2;
		do {
			regx2 = re2.exec(message);
			if (regx2 !== null) {
				if (regx2[1].length > 0 && regx2[1].indexOf(":") !== 0 && regx2[1].indexOf("@") !== 0 && regx2[1].indexOf("#") !== 0 && regx2[1].indexOf("http") === -1) {
					results2.push(regx2[1]);
				}
			}
		} while (regx2 !== null);
	}

	if (results.length + results2.length > maxSearches) {
		bot.sendMessage({
			to: channelID,
			message: "You can only search up to " + maxSearches + " cards!"
		});
	} else {
		if (results.length > 0) {
			for (let result of results) {
				searchCard(result, false, user, userID, channelID, message, event);
			}
		}
		if (results2.length > 0) {
			for (let result of results2) {
				searchCard(result, true, user, userID, channelID, message, event);
			}
		}
	}
});

bot.on('messageUpdate', function(oldMsg, newMsg, event) {
	if (newMsg.author && newMsg.author.id === bot.id) {
		return;
	}
	let lowMessage = newMsg.content && newMsg.content.toLowerCase();
	if (searchPage.active && lowMessage && lowMessage.indexOf(pre + "p") === 0 && lowMessage.indexOf("param") === -1) {
		libPage(newMsg.author.username, newMsg.author.id, newMsg.channelID, newMsg.content, event);
	}
	if (searchPage.active && lowMessage && lowMessage.indexOf(pre + "d") === 0) {
		libDesc(newMsg.author.username, newMsg.author.id, newMsg.channelID, newMsg.content, event);
	}
});

function help(user, userID, channelID, message, event) {
	bot.sendMessage({
		to: channelID,
		message: "I am a Yu-Gi-Oh! card bot made by AlphaKretin#7990.\nPrice data is from the <https://yugiohprices.com> API.\nYou can find my help file and source here: <https://github.com/AlphaKretin/bastion-bot/>\nYou can support my development on Patreon here: <https://www.patreon.com/alphakretinbots>"
	});
}

async function randomCard(user, userID, channelID, message, event) {
	try {
		let args = message.toLowerCase().split(" ");
		let code;
		let i = 0;
		let outLang = "en";
		for (let arg of args) {
			if (langs.indexOf(arg) > -1) {
				outLang = arg;
			}
		}
		if (args.length > 1) {
			let matches = [];
			for (let id of ids[outLang]) {
				if (randFilterCheck(id, args, outLang)) {
					matches.push(id);
				}
			}
			if (matches.length === 0) {
				return;
			}
			code = matches[Math.floor(Math.random() * matches.length)];
		} else {
			code = ids[outLang][Math.floor(Math.random() * ids[outLang].length)];
		}
		let out = await getCardInfo(code, outLang, user, userID, channelID, message, event);
		if (imagesEnabled && args.indexOf("image") > -1) {
			postImage(out[1], out[0], outLang, user, userID, channelID, message, event);
		} else {
			sendLongMessage(out[0], user, userID, channelID, message, event);
		}
	} catch (e) {
		console.log(e);
	}
}

async function script(user, userID, channelID, message, event) {
	let input = message.slice((pre + "script ").length);
	let inInt = parseInt(input);
	let index = ids.en.indexOf(inInt)
	if (index > -1) {
		try {
			let out = await getCardScript(index, user, userID, channelID, message, event);
			sendLongMessage(out, user, userID, channelID, message, event);
		} catch (e) {
			console.log("Error with search by ID:");
			console.log(e);
		}
	} else {
		try {
			let index = nameCheck(input, "en");
			if (index > -1 && index in ids.en) {
				let out = await getCardScript(index, user, userID, channelID, message, event);
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
	let args = input.split(",");
	let inLang = args[args.length - 2] && args[args.length - 2].replace(/ /g, "").toLowerCase();
	let outLang = args[args.length - 1] && args[args.length - 1].replace(/ /g, "").toLowerCase();
	if (langs.indexOf(inLang) > -1 && langs.indexOf(inLang) > -1) {
		input = args.splice(0, args.length - 2).toString();
	} else {
		inLang = "en";
		outLang = "en";
	}
	let inInt = parseInt(input);
	if (ids[outLang].indexOf(inInt) > -1) {
		try {
			let out = await getCardInfo(inInt, outLang, user, userID, channelID, message, event);
			if (hasImage) {
				postImage(out[1], out[0], outLang, user, userID, channelID, message, event);
			} else {
				sendLongMessage(out[0], user, userID, channelID, message, event);
			}
		} catch (e) {
			console.log("Error with search by ID:");
			console.log(e);
		}
	} else {
		try {
			let index = nameCheck(input, inLang);
			if (index > -1 && index in ids[inLang]) {
				index = ids[outLang].indexOf(ids[inLang][index]);
				if (index > -1 && index in ids[inLang]) {
					let out = await getCardInfo(ids[outLang][index], outLang, user, userID, channelID, message, event);
					if (hasImage) {
						postImage(out[1], out[0], outLang, user, userID, channelID, message, event);
					} else {
						sendLongMessage(out[0], user, userID, channelID, message, event);
					}
				} else {
					console.log("No corresponding entry in out language DB, please try again.");
					return;
				}
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

function getCardInfo(code, outLang, user, userID, channelID, message, event) {
	let index = ids[outLang].indexOf(code);
	if (index === -1) {
		console.log("Invalid card ID, please try again.");
		return "Invalid card ID, please try again.";
	}
	let card = contents[outLang][0].values[index];
	let name = names[outLang][0].values[index];
	return new Promise(function(resolve, reject) {
		let out = "__**" + name[1] + "**__\n";
		let alIDs = [code];
		if (aliases[outLang][ids[outLang].indexOf(code)] > 0) {
			if (getOT(ids[outLang].indexOf(code), outLang) === getOT(ids[outLang].indexOf(aliases[outLang][ids[outLang].indexOf(code)]), outLang)) {
				code = aliases[outLang][ids[outLang].indexOf(code)];
				alIDs = [code];
				for (let i = 0; i < aliases[outLang].length; i++) {
					if (aliases[outLang][i] === code && getOT(i, outLang) === getOT(ids[outLang].indexOf(code), outLang)) {
						alIDs.push(ids[outLang][i]);
					}
				}
			}
		} else if (aliases[outLang].indexOf(code) > 0) {
			for (let i = 0; i < aliases[outLang].length; i++) {
				if (aliases[outLang][i] === code && getOT(i, outLang) === getOT(ids[outLang].indexOf(code), outLang)) {
					alIDs.push(ids[outLang][i]);
				}
			}
		}
		out += "**ID**: " + alIDs.toString().replace(/,/g, "|") + "\n";
		let sets = setCodeCheck(index, outLang, user, userID, channelID, message, event);
		if (sets) {
			out += "**Archetype**: " + sets.toString().replace(/,/g, ", ") + "\n";
		} else {
			out += "\n";
		}
		request('https://yugiohprices.com/api/get_card_prices/' + name[1], function(error, response, body) {
			if (!error && response.statusCode === 200 && JSON.parse(body).status === "success") {
				let data = JSON.parse(body);
				let low = 9999999999;
				let hi = 0;
				let avgs = [];
				for (let price of data.data) {
					if (price.price_data.status === "success") {
						if (price.price_data.data.prices.high > hi) {
							hi = price.price_data.data.prices.high;
						}
						if (price.price_data.data.prices.low < low) {
							low = price.price_data.data.prices.low;
						}
						avgs.push(price.price_data.data.prices.average);
					}
				}
				let avg = (avgs.reduce((a, b) => a + b, 0)) / avgs.length;
				out += "**Status**: " + getOT(index, outLang) + " **Price**: $" + low.toFixed(2) + "-$" + avg.toFixed(2) + "-$" + hi.toFixed(2) + " USD\n";
			} else {
				out += "**Status**: " + getOT(index, outLang) + "\n";
			}
			let types = getTypes(index, outLang);
			if (types.indexOf("Monster") > -1) {
				let typesStr = types.toString().replace("Monster", getRace(index, outLang).toString().replace(/,/g, "|")).replace(/,/g, "/");
				out += "**Type**: " + typesStr + " **Attribute**: " + getAtt(index, outLang).toString().replace(/,/g, "|") + "\n";
				let lvName = "Level";
				let lv = getLevelScales(index, outLang);
				let def = true;
				if (types.indexOf("Xyz") > -1) {
					lvName = "Rank";
				} else if (types.indexOf("Link") > -1) {
					lvName = "Link Rating";
					def = false;
				}
				out += "**" + lvName + "**: " + lv[0] + " ";
				out += "**ATK**: " + convertStat(card[5]) + " ";
				if (def) {
					out += "**DEF**: " + convertStat(card[6]);
				} else {
					out += "**Link Markers**: " + getMarkers(index, outLang);
				}
				if (types.indexOf("Pendulum") > -1) {
					out += " **Pendulum Scale**: " + lv[1] + "/" + lv[2] + "\n";
				} else {
					out += "\n";
				}
				let cardText = getCardText(index, outLang);
				let textName = "Monster Effect";
				if (types.indexOf("Normal") > -1) {
					textName = "Flavour Text";
				}
				if (cardText.length === 2) {
					out += "**Pendulum Effect**: " + cardText[0] + "\n";
					out += "**" + textName + "**: " + cardText[1];
				} else {
					out += "**" + textName + "**: " + cardText[0];
				}
			} else if (types.indexOf("Spell") > -1 || types.indexOf("Trap") > -1) {
				let lv = getLevelScales(index, outLang)[0];
				if (lv > 0) { //is trap monster
					let typesStr = getRace(index, outLang).toString().replace(/,/g, "|") + "/" + types.toString().replace(/,/g, "/");
					out += "**Type**: " + typesStr + " **Attribute**: " + getAtt(index, outLang).toString().replace(/,/g, "|") + "\n";
					out += "**Level**: " + lv + " **ATK**: " + convertStat(card[5]) + " **DEF**: " + convertStat(card[6]) + "\n";
				} else {
					out += "**Type**: " + types.toString().replace(/,/g, "/") + "\n";
				}
				out += "**Effect**: " + name[2].replace(/\n/g, "\n");
			} else {
				out += "**Card Text**: " + name[2].replace(/\n/g, "\n");
			}
			resolve([out, alIDs]);
		});
	});
}

async function postImage(code, out, outLang, user, userID, channelID, message, event) {
	try {
		let imageUrl = imageUrlMaster;
		if (["Anime", "Illegal", "Video Game"].indexOf(getOT(ids[outLang].indexOf(code[0]), outLang)) > -1) {
			imageUrl = imageUrlAnime;
		}
		if (getOT(ids[outLang].indexOf(code[0]), outLang) === "Custom") {
			imageUrl = imageUrlCustom;
		}
		if (code.length > 1) {
			let pics = [];
			for (let cod of code) {
				let buffer = await downloadImage(imageUrl + cod + ".png", user, userID, channelID, message, event);
				if (filetype(buffer) && filetype(buffer).ext === "png") {
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
			while (pics.length) {
				a.push(pics.splice(0, 4));
			}
			for (let pic of a) {
				let tempImg = pic[0];
				for (let i = 1; i < pic.length; i++) {
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
				for (let i = 1; i < b.length; i++) {
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
				filename: code + ".png"
			}, function(err, res) {
				sendLongMessage(out, user, userID, channelID, message, event);
			});
		} else {
			let buffer = await downloadImage(imageUrl + code[0] + ".png", user, userID, channelID, message, event);
			if (buffer) {
				bot.uploadFile({
					to: channelID,
					file: buffer,
					filename: code[0] + ".png"
				}, function(err, res) {
					sendLongMessage(out, user, userID, channelID, message, event);
				});
			} else {
				sendLongMessage(out, user, userID, channelID, message, event);
			}

		}
	} catch (e) {
		console.log(e);
	}

}

function downloadImage(imageUrl, user, userID, channelID, message, event) {
	return new Promise(function(resolve, reject) {
		https.get(url.parse(imageUrl), function(response) {
			let data = [];
			response.on('data', function(chunk) {
				data.push(chunk);
			}).on('end', function() {
				let buffer = Buffer.concat(data);
				if (filetype(buffer) && filetype(buffer).ext === "png") {
					jimp.read(buffer, function(err, image) {
						if (err) {
							reject(err)
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

async function getSingleProp(prop, user, userID, channelID, message, event) {
	let input = message.slice((pre + prop + " ").length);
	let inInt = parseInt(input);
	let index = 0;
	if (ids.en.indexOf(inInt) > -1) {
		index = ids.en.indexOf(inInt);
	} else {
		index = nameCheck(input, "en");
	}
	if (index > -1 && index in ids.en) {
		let out = "";
		switch (prop) {
			case "name":
				out = names.en[0].values[index][1];
				break;
			case "id":
				let code = ids.en[index];
				let alIDs = [code];
				if (aliases.en[ids.en.indexOf(code)] > 0) {
					if (getOT(ids.en.indexOf(code), "en") === getOT(ids.en.indexOf(aliases.en[ids.en.indexOf(code)]), "en")) {
						code = aliases.en[ids.en.indexOf(code)];
						alIDs = [code];
						for (let i = 0; i < aliases.en.length; i++) {
							if (aliases.en[i] === code && getOT(i) === getOT(ids.en.indexOf(code), "en")) {
								alIDs.push(ids.en[i]);
							}
						}
					}
				} else if (aliases.en.indexOf(code) > 0) {
					for (let i = 0; i < aliases.en.length; i++) {
						if (aliases.en[i] === code && getOT(i, "en") === getOT(ids.en.indexOf(code), "en")) {
							alIDs.push(ids.en[i]);
						}
					}
				}
				out = alIDs.toString().replace(/,/g, "|");
				break;
			case "status":
				out = getOT(index, "en");
				break;
			case "price":
				try {
					out = await new Promise(function(resolve, reject) {
						request('https://yugiohprices.com/api/get_card_prices/' + names.en[0].values[index][1], function(error, response, body) {
							if (!error && JSON.parse(body).status === "success") {
								let data = JSON.parse(body);
								let low = 9999999999;
								let hi = 0;
								let avgs = [];
								for (let price of data.data) {
									if (price.price_data.status === "success") {
										if (price.price_data.data.prices.high > hi) {
											hi = price.price_data.data.prices.high;
										}
										if (price.price_data.data.prices.low < low) {
											low = price.price_data.data.prices.low;
										}
										avgs.push(price.price_data.data.prices.average);
									}
								}
								let avg = (avgs.reduce((a, b) => a + b, 0)) / avgs.length;
								resolve("$" + low.toFixed(2) + "-$" + avg.toFixed(2) + "-$" + hi.toFixed(2) + " USD");
							} else {
								reject(error);
							}
						});
					});
				} catch (e) {
					console.log(e);
					return;
				}
				break;
			case "effect":
				let cardText = getCardText(index, "en");
				if (cardText.length === 2) {
					out = cardText[1];
				} else {
					out = cardText[0];
				}
				break;
			case "peffect":
				let pText = getCardText(index, "en");
				if (pText.length === 2) {
					out = pText[0];
				} else {
					return;
				}
				break;
			case "type":
				let types = getTypes(index, "en");
				if (types.indexOf("Monster") > -1) {
					out = types.toString().replace("Monster", getRace(index, "en").toString().replace(/,/g, "|")).replace(/,/g, "/");
				} else {
					let lv = getLevelScales(index, "en")[0];
					if (lv > 0) { //is trap monster
						out = getRace(index, "en").toString().replace(/,/g, "|") + "/" + types.toString().replace(/,/g, "/");
					} else {
						out = types.toString().replace(/,/g, "/");
					}
				}
				break;
			case "att":
				let typs = getTypes(index, "en");
				if (typs.indexOf("Monster") > -1) {
					out = getAtt(index, "en").toString().replace(/,/g, "|");
				} else {
					let lv = getLevelScales(index, "en")[0];
					if (lv > 0) { //is trap monster
						out = getAtt(index, "en").toString().replace(/,/g, "|");
					}
				}
				break;
			case "stats":
				let tys = getTypes(index, "en");
				let card = contents.en[0].values[index];
				if (tys.indexOf("Monster") > -1) {
					let lvName = "Level";
					let lv = getLevelScales(index, "en");
					let def = true;
					if (tys.indexOf("Xyz") > -1) {
						lvName = "Rank";
					} else if (tys.indexOf("Link") > -1) {
						lvName = "Link Rating";
						def = false;
					}
					out = "**" + lvName + "**: " + lv[0] + " ";
					out += "**ATK**: " + convertStat(card[5]) + " ";
					if (def) {
						out += "**DEF**: " + convertStat(card[6]);
					} else {
						out += "**Link Markers**: " + getMarkers(index, "en");
					}
					if (tys.indexOf("Pendulum") > -1) {
						out += " **Pendulum Scale**: " + lv[1] + "/" + lv[2];
					}
				} else {
					let lv = getLevelScales(index, "en")[0];
					if (lv > 0) { //is trap monster
						out = "**Level**: " + lv + " **ATK**: " + convertStat(card[5]) + " **DEF**: " + convertStat(card[6]);
					}
				}
				break;
			default:
				return;
		}
		if (out.length > 0) {
			bot.sendMessage({
				to: channelID,
				message: out
			});
		}
	} else {
		console.log("Invalid card ID or name, please try again.");
	}
}

function getCardScript(index, user, userID, channelID, message, event) {
	return new Promise(function(resolve, reject) {
		let scriptUrl = scriptUrlMaster;
		if (["Anime", "Illegal", "Video Game"].indexOf(getOT(index, "en")) > -1) {
			scriptUrl = scriptUrlAnime;
		}
		if (getOT(index, "en") === "Custom") {
			scriptUrl = scriptUrlCustom;
		}
		let fullUrl = scriptUrl + "c" + ids.en[index] + ".lua";
		https.get(url.parse(fullUrl), function(response) {
			let data = [];
			response.on('data', function(chunk) {
				data.push(chunk);
			}).on('end', async function() {
				let buffer = Buffer.concat(data);
				let script = buffer.toString();
				if (script === "404: Not Found\n" && scriptBackupEnabled) {
					script = await new Promise(function(resolve, reject) {
						fullUrl = scriptUrlBackup + "c" + ids.en[index] + ".lua";
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
				if (script.length + "```lua\n```\n".length + fullUrl.length > 2000) {
					resolve(fullUrl);
				} else {
					resolve("```lua\n" + script + "```\n" + fullUrl);
				}
			});
		});
	});
}

function matches(user, userID, channelID, message, event) {
	let arg = message.slice((pre + "matches ").length);
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
		arg = lineArr.toString().replace(/,/g, " ");
	}
	let results = fuse.en.search(arg);
	if (results.length < 1) {
		bot.sendMessage({
			to: channelID,
			message: "No matches found!"
		});
	} else {
		let out = "Top 10 card name matches for `" + arg + "`:";
		let i = 0;
		let outs = [];
		let ot = getOT(ids.en.indexOf(results[0].item.id), "en");
		while (results[i] && outs.length < 10) {
			let index = ids.en.indexOf(results[i].item.id)
			if (ot === getOT(index, "en") && aliasCheck(index, "en")) {
				outs.push("\n" + (outs.length + 1) + ". " + results[i].item.name);
			}
			i++;
		}
		for (let o of outs) {
			out += o;
		}
		bot.sendMessage({
			to: channelID,
			message: out
		});
	}
}

function set(user, userID, channelID, message, event) {
	let arg = message.slice((pre + "set ").length);
	if (arg.toLowerCase() in setcodes) {
		bot.sendMessage({
			to: channelID,
			message: setcodes[arg] + ": " + arg
		});
	} else {
		Object.keys(setcodes).forEach(function(key, index) {
			if (setcodes[key].toLowerCase() == arg.toLowerCase()) {
				bot.sendMessage({
					to: channelID,
					message: setcodes[key] + ": " + key
				});
				return;
			}
		});
	}
}

//utility functions
function sendLongMessage(out, user, userID, channelID, message, event) {
	return new Promise(function(resolve, reject) {
		try {
			if (out.length > 2000) {
				let outArr = [out.slice(0, 2000 - longStr.length) + longStr, out.slice(2000 - longStr.length)];
				longMsg = outArr[1];
				bot.sendMessage({
					to: channelID,
					message: outArr[0]
				}, function(err, res) {
					if (err) {
						reject(err);
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
						reject(err);
					} else {
						resolve(res);
					}
				});
			}
		} catch (e) {
			reject(e);
		}
	});
}

function nameCheck(line, inLang) {
	if (langs.indexOf(inLang) === -1) {
		inLang = "en";
	}
	for (let i = 0; i < names[inLang][0].values.length; i++) { //check all entries for exact name
		if (names[inLang][0].values[i][1].toLowerCase() === line.toLowerCase()) {
			return i;
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
		let newLine = lineArr.toString().replace(/,/g, " ");
		for (let i = 0; i < names[inLang][0].values.length; i++) { //check all entries for exact name
			if (names[inLang][0].values[i][1].toLowerCase() === newLine.toLowerCase()) {
				return i;
			}
		}
		let result = fuse[inLang].search(newLine);
		if (result.length < 1) {
			return -1;
		} else {
			let index = -1;
			for (let i = 0; i < names[inLang][0].values.length; i++) {
				if (names[inLang][0].values[i][1].toLowerCase() === result[0].item.name.toLowerCase()) {
					index = i;
				}
			}
			return index;
		}
	} else {
		let result = fuse[inLang].search(line);
		if (result.length < 1) {
			return -1;
		} else {
			let index = -1;
			for (let i = 0; i < names[inLang][0].values.length; i++) {
				if (names[inLang][0].values[i][1].toLowerCase() === result[0].item.name.toLowerCase()) {
					index = i;
				}
			}
			return index;
		}
	}
}

function convertStat(stat) {
	if (stat === -2) {
		return "?";
	} else {
		return stat;
	}
}

function getLevelScales(index, outLang) {
	let level = contents[outLang][0].values[index][7];
	return [level & 0xff, (level & 0xf000000) >> 24, (level & 0xf0000) >> 16];
}

function getOT(index, outLang) {
	let ot = contents[outLang][0].values[index][1];
	switch (ot) {
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

function getRace(index, outLang) {
	let race = contents[outLang][0].values[index][8];
	let races = [];
	if (race & 0x1) {
		races.push("Warrior");
	}
	if (race & 0x2) {
		races.push("Spellcaster");
	}
	if (race & 0x4) {
		races.push("Fairy");
	}
	if (race & 0x8) {
		races.push("Fiend");
	}
	if (race & 0x10) {
		races.push("Zombie");
	}
	if (race & 0x20) {
		races.push("Machine");
	}
	if (race & 0x40) {
		races.push("Aqua");
	}
	if (race & 0x80) {
		races.push("Pyro");
	}
	if (race & 0x100) {
		races.push("Rock");
	}
	if (race & 0x200) {
		races.push("Winged Beast");
	}
	if (race & 0x400) {
		races.push("Plant");
	}
	if (race & 0x800) {
		races.push("Insect");
	}
	if (race & 0x1000) {
		races.push("Thunder");
	}
	if (race & 0x2000) {
		races.push("Dragon");
	}
	if (race & 0x4000) {
		races.push("Beast");
	}
	if (race & 0x8000) {
		races.push("Beast-Warrior");
	}
	if (race & 0x10000) {
		races.push("Dinosaur");
	}
	if (race & 0x20000) {
		races.push("Fish");
	}
	if (race & 0x40000) {
		races.push("Sea Serpent");
	}
	if (race & 0x80000) {
		races.push("Reptile");
	}
	if (race & 0x100000) {
		races.push("Psychic");
	}
	if (race & 0x200000) {
		races.push("Divine-Beast");
	}
	if (race & 0x400000) {
		races.push("Creator God");
	}
	if (race & 0x800000) {
		races.push("Wyrm");
	}
	if (race & 0x1000000) {
		races.push("Cyberse");
	}
	if (race & 0x80000000) {
		races.push("Yokai");
	}
	if (race === 0x100000000) {
		races.push("Charisma");
	}
	if (races.length === 0) {
		return ["Null Race"];
	} else {
		return races;
	}
}

function getAtt(index, outLang) {
	let att = contents[outLang][0].values[index][9];
	let atts = [];
	if (att & 0x1) {
		atts.push("EARTH");
	}
	if (att & 0x2) {
		atts.push("WATER");
	}
	if (att & 0x4) {
		atts.push("FIRE");
	}
	if (att & 0x8) {
		atts.push("WIND");
	}
	if (att & 0x10) {
		atts.push("LIGHT");
	}
	if (att & 0x20) {
		atts.push("DARK");
	}
	if (att & 0x40) {
		atts.push("DIVINE");
	}
	if (att & 0x80) {
		atts.push("LAUGH");
	}
	if (atts.length === 0) {
		return ["Null Attribute"];
	} else {
		return atts;
	}
}

function getMarkers(index, outLang) {
	let marks = contents[outLang][0].values[index][6];
	let out = "";
	if (marks & 0x001) {
		out += "↙️";
	}
	if (marks & 0x002) {
		out += "⬇️";
	}
	if (marks & 0x004) {
		out += "↘️";
	}
	if (marks & 0x008) {
		out += "⬅️";
	}
	if (marks & 0x020) {
		out += "➡️";
	}
	if (marks & 0x040) {
		out += "↖️";
	}
	if (marks & 0x080) {
		out += "⬆️";
	}
	if (marks & 0x100) {
		out += "↗️";
	}
	return out;
}

function getTypes(index, outLang) {
	let types = [];
	let type = contents[outLang][0].values[index][4];
	if (type & 0x1) {
		types.push("Monster");
	}
	if (type & 0x2) {
		types.push("Spell");
	}
	if (type & 0x4) {
		types.push("Trap");
	}
	//normal goes here in numeric order but I put it at the end so that it's at the end of any list of types
	//effect goes here in numeric order but I put it at the end so that it's at the end of any list of types
	if (type & 0x40) {
		types.push("Fusion");
	}
	if (type & 0x80) {
		types.push("Ritual");
	}
	if (type & 0x200) {
		types.push("Spirit");
	}
	if (type & 0x400) {
		types.push("Union");
	}
	if (type & 0x800) {
		types.push("Gemini");
	}
	if (type & 0x1000) {
		types.push("Tuner");
	}
	if (type & 0x2000) {
		types.push("Synchro");
	}
	if (type & 0x4000) {
		types.push("Token");
	}
	if (type & 0x10000) {
		types.push("Quick-Play");
	}
	if (type & 0x20000) {
		types.push("Continuous");
	}
	if (type & 0x40000) {
		types.push("Equip");
	}
	if (type & 0x80000) {
		types.push("Field");
	}
	if (type & 0x100000) {
		types.push("Counter");
	}
	if (type & 0x200000) {
		types.push("Flip");
	}
	if (type & 0x400000) {
		types.push("Toon");
	}
	if (type & 0x800000) {
		types.push("Xyz");
	}
	if (type & 0x1000000) {
		types.push("Pendulum");
	}
	if (type & 0x2000000) {
		types.push("Special Summon");
	}
	if (type & 0x4000000) {
		types.push("Link");
	}
	if (type & 0x10000000) {
		types.push("Armor");
	}
	if (type & 0x20000000) {
		types.push("Plus");
	}
	if (type & 0x40000000) {
		types.push("Minus");
	}
	if (type & 0x10) {
		types.push("Normal");
	}
	if (type & 0x20) {
		types.push("Effect");
	}
	return types;
}

function getCardText(index, outLang) {
	let cardText = names[outLang][0].values[index][2];
	let re = /\][\s\S]*?\n([\S\s]*?)\n-/g;
	let regx = re.exec(cardText);
	if (regx === null) {
		return [cardText];
	} else {
		let outArr = [];
		outArr.push(regx[1]);
		let re2 = /(?:r Effect|xt) ?\]\R*([\S\s]*)/g;
		outArr.push(re2.exec(cardText)[1]);
		return outArr;
	}
}

function randFilterCheck(code, args, outLang) {
	let otFilters = [];
	let typeFilters = [];
	let raceFilters = [];
	let attFilters = [];
	let lvFilters = [];
	for (let arg of args) {
		if (["ocg", "tcg", "tcg/ocg", "anime", "illegal", "video", "game", "custom"].indexOf(arg) > -1) {
			if (arg === "video" || arg === "game") {
				otFilters.push("video game");
			} else {
				otFilters.push(arg);
			}
		}
		if (["monster", "spell", "trap", "fusion", "ritual", "spirit", "union", "gemini", "tuner", "synchro", "token", "quick-play", "continuous", "equip", "field", "counter", "flip", "toon", "xyz", "pendulum", "special summon", "link", "armor", "plus", "minus", "normal", "effect"].indexOf(arg) > -1) {
			typeFilters.push(arg);
		}
		if (["warrior", "spellcaster", "fairy", "fiend", "zombie", "machine", "aqua", "pyro", "rock", "winged beast", "plant", "insect", "thunder", "dragon", "beast", "beast-warrior", "dinosaur", "fish", "sea serpent", "reptile", "psychic", "divine-beast", "creator god", "wyrm", "cyberse", "yokai", "charisma"].indexOf(arg) > -1) {
			raceFilters.push(arg);
		}
		if (["earth", "wind", "water", "fire", "light", "dark", "divine", "laugh"].indexOf(arg) > -1) {
			attFilters.push(arg);
		}
		if (["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].indexOf(arg) > -1) {
			lvFilters.push(arg);
		}
	}
	if (otFilters.length + typeFilters.length + raceFilters.length + attFilters.length + lvFilters.length === 0) {
		return true;
	} else {
		let index = ids[outLang].indexOf(code);
		let boo = true;
		if (otFilters.length > 0 && otFilters.indexOf(getOT(index, outLang).toLowerCase()) === -1) {
			boo = false;
		}
		if (typeFilters.length > 0) {
			let subBoo = false;
			for (let type of getTypes(index, outLang)) {
				if (typeFilters.indexOf(type.toLowerCase()) > -1) {
					subBoo = true;
				}
			}
			boo = subBoo;
		}
		if (raceFilters.length > 0 && raceFilters.indexOf(getRace(index, outLang)[0].toLowerCase()) === -1) {
			boo = false;
		}
		if (attFilters.length > 0 && attFilters.indexOf(getAtt(index, outLang)[0].toLowerCase()) === -1) {
			boo = false;
		}
		if (lvFilters.length > 0 && lvFilters.indexOf(getLevelScales(index, outLang)[0].toString()) === -1) {
			boo = false;
		}
		return boo;
	}
}

function setCodeCheck(index, outLang, user, userID, channelID, message, event) {
	if (aliases[outLang][index] > 0) {
		index = ids[outLang].indexOf(aliases[outLang][index]);
	}
	let code = contents[outLang][0].values[index][3].toString("16");
	if (code === "0") {
		return false;
	}
	let sets = [];
	let codes = ["0x" + code.slice(0, 4).replace(/^[0]+/g, ""), "0x" + code.slice(4, 8).replace(/^[0]+/g, ""), "0x" + code.slice(8, 12).replace(/^[0]+/g, ""), "0x" + code.slice(12, 16).replace(/^[0]+/g, "")];
	for (let co of codes) {
		if (co in setcodes) {
			sets.push(setcodes[co]);
		}
	}
	if (sets.length === 0) {
		return false;
	} else {
		return sets;
	}
}

function aliasCheck(index, outLang) {
	let alias = aliases[outLang][index];
	if (alias === 0) {
		return true;
	}
	let alIndex = ids[outLang].indexOf(alias);
	return getOT(index, outLang) !== getOT(alIndex, outLang);
}

function getIncInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

//games
function trivia(user, userID, channelID, message, event) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	if (channelID in gameData || (triviaLocks[serverID] && triviaLocks[serverID].indexOf(channelID) === -1)) {
		return;
	} else {
		let ot = ["TCG", "OCG", "TCG/OCG"];
		let args = message.toLowerCase().split(" ");
		if (args.indexOf("tcg") > -1) {
			ot = ["TCG"];
		} else if (args.indexOf("ocg") > -1) {
			ot = ["OCG"];
		} else if (args.indexOf("anime") > -1) {
			ot = ["Anime", "Video Game", "Illegal"];
		} else if (args.indexOf("custom") > -1) {
			ot = ["Custom"];
		}
		let outLang = "en";
		for (let arg of args) {
			if (langs.indexOf(arg) > -1) {
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
		startTriviaRound(ot, round, hard, outLang, user, userID, channelID, message, event);
	}
}

async function startTriviaRound(ot, round, hard, outLang, user, userID, channelID, message, event) {
	//pick a random card
	let index;
	let code;
	let buffer;
	do {
		index = Math.floor(Math.random() * ids[outLang].length);
		code = ids[outLang][index];
		let imageUrl = imageUrlMaster;
		if (["Anime", "Illegal", "Video Game"].indexOf(getOT(ids[outLang].indexOf(code), outLang)) > -1) {
			imageUrl = imageUrlAnime;
		}
		if (getOT(ids[outLang].indexOf(code), outLang) === "Custom") {
			imageUrl = imageUrlCustom;
		}
		if (ot.indexOf(getOT(index, outLang)) > -1) {
			buffer = await new Promise(function(resolve, reject) {
				https.get(url.parse(imageUrl + code + ".png"), function(response) {
					let data = [];
					response.on('data', function(chunk) {
						data.push(chunk);
					}).on('end', async function() {
						resolve(Buffer.concat(data));
					});
				});
			});
		}
	} while (ot.indexOf(getOT(index, outLang)) === -1 || !(filetype(buffer) && filetype(buffer).ext === "png"));
	let name = names[outLang][0].values[index][1];
	let hint = "";
	for (let letter of name) {
		if (getIncInt(0, 2) !== 0 && letter !== " ") {
			letter = "_";
		}
		hint += letter + " ";
	}
	if (channelID in gameData) {
		//start game
		gameData[channelID].name = name;
		gameData[channelID].hint = hint;
		gameData[channelID].round = round;
	} else {
		//start game
		gameData[channelID] = {
			"game": "trivia",
			"name": name,
			"hint": hint,
			"round": round,
			"ot": ot,
			"score": {},
			"hard": hard,
			"lang": outLang
		}
	}
	if (hard) {
		buffer = await hardCrop(buffer, user, userID, channelID, message, event);
	}
	bot.uploadFile({
		to: channelID,
		file: buffer,
		filename: code + ".png"
	}, function(err, res) {
		if (err) {
			console.log(err);
		} else {
			bot.sendMessage({
				to: channelID,
				message: "Can you name this card? Time remaining: `" + triviaTimeLimit / 1000 + "`"
			}, function(err, res) {
				if (err) {
					console.log(err);
				} else {
					let messageID = res.id;
					let i = triviaTimeLimit / 1000 - 1;
					gameData[channelID].IN = setInterval(function() {
						bot.editMessage({
							channelID: channelID,
							messageID: messageID,
							message: "Can you name this card? Time remaining: `" + i + "`"
						});
						i--;
					}, 1000);
				}
			});
			gameData[channelID].TO1 = setTimeout(function() {
				bot.sendMessage({
					to: channelID,
					message: "Have a hint: `" + gameData[channelID].hint + "`"
				});
			}, triviaHintTime);
			let out = "Time's up! The card was **" + gameData[channelID].name + "**!\n";
			if (Object.keys(gameData[channelID].score).length > 0) {
				out += "**Scores**:\n";
				Object.keys(gameData[channelID].score).forEach(function(key, index) {
					out += bot.users[key].username + ": " + gameData[channelID].score[key] + "\n";
				});
			}
			if (gameData[channelID].round === 1) {
				out += "The game is over! ";
				if (Object.keys(gameData[channelID].score).length > 0) {
					let winners = [];
					Object.keys(gameData[channelID].score).forEach(function(key, index) {
						if (index === 0 || gameData[channelID].score[key] > gameData[channelID].score[winners[0]]) {
							winners = [key];
						} else if (gameData[channelID].score[key] === gameData[channelID].score[winners[0]]) {
							winners.push(key)
						}
					});
					if (winners.length > 1) {
						out += "It was a tie! The winners are <@" + winners.toString().replace(/,/g, ">, <@") + ">!";
					} else {
						out += "The winner is <@" + winners + ">!";
					}
				}
				gameData[channelID].TO2 = setTimeout(function() {
					bot.sendMessage({
						to: channelID,
						message: out
					});
					clearInterval(gameData[channelID].IN);
					delete gameData[channelID];
				}, triviaTimeLimit);
			} else {
				gameData[channelID].TO2 = setTimeout(function() {
					bot.sendMessage({
						to: channelID,
						message: out
					});
					clearInterval(gameData[channelID].IN);
					startTriviaRound(gameData[channelID].ot, (gameData[channelID].round - 1), gameData[channelID].hard, gameData[channelID].lang, user, userID, channelID, message, event);
				}, triviaTimeLimit);
			}
		}
	});
}

function hardCrop(buffer, user, userID, channelID, message, event) {
	return new Promise(function(resolve, reject) {
		jimp.read(buffer, function(err, image) {
			if (err) {
				reject(err)
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
	if (!(channelID in gameData) || gameData[channelID].game !== "trivia") {
		return;
	}
	let out;
	if (message.toLowerCase().indexOf(pre + "tq") === 0) {
		clearTimeout(gameData[channelID].TO1);
		clearTimeout(gameData[channelID].TO2);
		clearInterval(gameData[channelID].IN);
		out = "<@" + userID + "> quit the game. The answer was **" + gameData[channelID].name + "**!\n"
		if (Object.keys(gameData[channelID].score).length > 0) {
			out += "\n**Scores**:\n";
			Object.keys(gameData[channelID].score).forEach(function(key, index) {
				out += bot.users[key].username + ": " + gameData[channelID].score[key] + "\n";
			});
		}
		if (Object.keys(gameData[channelID].score).length > 0) {
			let winners = [];
			Object.keys(gameData[channelID].score).forEach(function(key, index) {
				if (index === 0 || gameData[channelID].score[key] > gameData[channelID].score[winners[0]]) {
					winners = [key];
				} else if (gameData[channelID].score[key] === gameData[channelID].score[winners[0]]) {
					winners.push(key)
				}
			});
			if (winners.length > 1) {
				out += "It was a tie! The winners are <@" + winners.toString().replace(/,/g, ">, <@") + ">!";
			} else {
				out += "The winner is <@" + winners + ">!";
			}
		}
		bot.sendMessage({
			to: channelID,
			message: out
		});
		delete gameData[channelID];
	} else if (message.toLowerCase() === gameData[channelID].name.toLowerCase()) {
		clearTimeout(gameData[channelID].TO1);
		clearTimeout(gameData[channelID].TO2);
		clearInterval(gameData[channelID].IN);
		bot.addReaction({
			channelID: channelID,
			messageID: event.d.id,
			reaction: "👍"
		});
		out = "<@" + userID + "> got it! The answer was **" + gameData[channelID].name + "**!\n";
		if (gameData[channelID].score[userID]) {
			gameData[channelID].score[userID]++;
		} else {
			gameData[channelID].score[userID] = 1;
		}
		if (Object.keys(gameData[channelID].score).length > 0) {
			out += "**Scores**:\n";
			Object.keys(gameData[channelID].score).forEach(function(key, index) {
				out += bot.users[key].username + ": " + gameData[channelID].score[key] + "\n";
			});
		}
		if (gameData[channelID].round === 1) {
			out += "The game is over! ";
			if (Object.keys(gameData[channelID].score).length > 0) {
				let winners = [];
				Object.keys(gameData[channelID].score).forEach(function(key, index) {
					if (index === 0 || gameData[channelID].score[key] > gameData[channelID].score[winners[0]]) {
						winners = [key];
					} else if (gameData[channelID].score[key] === gameData[channelID].score[winners[0]]) {
						winners.push(key)
					}
				});
				if (winners.length > 1) {
					out += "It was a tie! The winners are <@" + winners.toString().replace(/,/g, ">, <@") + ">!";
				} else {
					out += "The winner is <@" + winners + ">!";
				}
			}
			bot.sendMessage({
				to: channelID,
				message: out
			});
			delete gameData[channelID];
		} else {
			bot.sendMessage({
				to: channelID,
				message: out
			});
			startTriviaRound(gameData[channelID].ot, (gameData[channelID].round - 1), gameData[channelID].hard, gameData[channelID].lang, user, userID, channelID, message, event);
		}
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
				bot.sendMessage({
					to: channelID,
					message: "Trivia no longer locked to this channel!\nTrivia is locked to the following channels on this server: " + out.toString().replace(/,/g, ", ")
				});
				config.triviaLocks = triviaLocks;
				fs.writeFileSync('config/config.json', JSON.stringify(config), 'utf8');
			} else {
				delete triviaLocks[serverID];
				bot.sendMessage({
					to: channelID,
					message: "Trivia no longer locked to any channel on this server!"
				})
				config.triviaLocks = triviaLocks;
				fs.writeFileSync('config/config.json', JSON.stringify(config), 'utf8');
			}
		} else {
			triviaLocks[serverID].push(channelID);
			let out = [];
			for (let lock of triviaLocks[serverID]) {
				out.push("<#" + lock + ">");
			}
			bot.sendMessage({
				to: channelID,
				message: "Trivia locked to this channel!\nTrivia is locked to the following channels on this server: " + out.toString().replace(/,/g, ", ")
			});
			config.triviaLocks = triviaLocks;
			fs.writeFileSync('config/config.json', JSON.stringify(config), 'utf8');
		}
	} else {
		triviaLocks[serverID] = [channelID];
		let out = [];
		for (let lock of triviaLocks[serverID]) {
			out.push("<#" + lock + ">");
		}
		bot.sendMessage({
			to: channelID,
			message: "Trivia locked to this channel!\nTrivia is locked to the following channels on this server: " + out.toString().replace(/,/g, ", ")
		});
		config.triviaLocks = triviaLocks;
		fs.writeFileSync('config/config.json', JSON.stringify(config), 'utf8');
	}
}

//permission handling
function _getPermissionArray(number) {
	let permissions = [];
	let binary = (number >>> 0).toString(2).split('');
	binary.forEach(function(bit, index) {
		if (bit == 0)
			return;

		Object.keys(Discord.Permissions).forEach(function(p) {
			if (Discord.Permissions[p] == (binary.length - index - 1))
				permissions.push(p);
		});
	});
	return permissions;
}

function getPermissions(userID, channelID) {
	let serverID = bot.channels[channelID].guild_id;

	let permissions = [];

	bot.servers[serverID].members[userID].roles.concat([serverID]).forEach(function(roleID) {
		_getPermissionArray(bot.servers[serverID].roles[roleID].permissions).forEach(function(perm) {
			if (permissions.indexOf(perm) < 0)
				permissions.push(perm);
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
	bot.sendMessage({
		to: owner,
		message: out
	});
}

//scripting lib 
function searchFunctions(user, userID, channelID, message, event) {
	let arg = message.slice((pre + "f ").length);
	let searched = [];
	let len = 0;
	for (let func of libFunctions) {
		if (func.name.toLowerCase().split("(")[0].indexOf(arg.toLowerCase()) > -1) {
			searched.push(func);
			if (func.sig.length > len) {
				len = func.sig.length;
			}
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
	for (let i = 0; i < pages[0].length; i++) {
		let line = pages[0][i];
		while (line.sig.length < len) {
			line.sig = " " + line.sig;
		}
		out += "[" + (i + 1) + "] " + line.sig + " | " + line.name + "\n"
	}
	out += "````Page: 1/" + pages.length + "`";
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

function searchConstants(user, userID, channelID, message, event) {
	let arg = message.slice((pre + "c ").length);
	let searched = [];
	let len = 0;
	for (let con of libConstants) {
		if (con.name.toLowerCase().indexOf(arg.toLowerCase()) > -1) {
			searched.push(con);
			if (con.val.length > len) {
				len = con.val.length;
			}
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
	for (let i = 0; i < pages[0].length; i++) {
		let line = pages[0][i];
		while (line.val.length < len) {
			line.val = " " + line.val;
		}
		out += "[" + (i + 1) + "] " + line.val + " | " + line.name + "\n"
	}
	out += "````Page: 1/" + pages.length + "`";
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

function searchParams(user, userID, channelID, message, event) {
	let arg = message.slice((pre + "param ").length);
	let searched = [];
	let len = 0;
	for (let par of libParams) {
		if (par.name.toLowerCase().indexOf(arg.toLowerCase()) > -1) {
			searched.push(par);
			if (par.type.length > len) {
				len = par.type.length;
			}
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
	for (let i = 0; i < pages[0].length; i++) {
		let line = pages[0][i];
		while (line.type.length < len) {
			line.type = " " + line.type;
		}
		out += "[" + (i + 1) + "] " + line.type + " | " + line.name + "\n"
	}
	out += "````Page: 1/" + pages.length + "`";
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

function libPage(user, userID, channelID, message, event) {
	let arg = parseInt(message.slice((pre + "p").length));
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
	for (let line of pages[index]) {
		if (line[n].length > len) {
			len = line[n].length;
		}
	}
	let out = "```cs\n";
	for (let i = 0; i < pages[index].length; i++) {
		let line = pages[index][i];
		while (line[n].length < len) {
			line[n] = " " + line[n];
		}
		out += "[" + (i + 1) + "] " + line[n] + " | " + line.name + "\n"
	}
	out += "````Page: " + arg + "/" + pages.length + "`";
	searchPage.index = index;
	searchPage.content = out;
	bot.editMessage({
		channelID: searchPage.channel,
		messageID: searchPage.message,
		message: out
	});
}

function libDesc(user, userID, channelID, message, event) {
	let arg = parseInt(message.slice((pre + "d").length));
	if (userID !== searchPage.user || arg === NaN || arg > searchPage.pages[searchPage.index].length) {
		return;
	}
	let index = arg - 1;
	let desc = searchPage.pages[searchPage.index][index].desc;
	if (desc.length === 0) {
		desc = "No description found for this entry.";
	}
	bot.editMessage({
		channelID: searchPage.channel,
		messageID: searchPage.message,
		message: searchPage.content + "\n`" + desc + "`"
	});
}