const fs = require("fs");

let c = require("./config.js")(); //load data from JSON into a special class. Expected values can be intuited from console feedback or seen in the readme.
let config = c[0];
let Conf = c[1];
if (!config.getConfig("token")) {
	console.error("No Discord user token found at config.token! Exiting..."); //need the token to work as a bot, rest can be left out or defaulted. 
	process.exit();
}

let dbs = JSON.parse(JSON.stringify(config.getConfig("staticDBs")));

const GitHubApi = require("github");
let github = new GitHubApi({
	debug: false
});

//more config files, all explained in the readme
let shortcuts = JSON.parse(fs.readFileSync("config/" + config.getConfig("shortcutDB"), "utf8"));
let setcodes = JSON.parse(fs.readFileSync("config/" + config.getConfig("setcodesDB"), "utf8"));
let counters = JSON.parse(fs.readFileSync("config/" + config.getConfig("countersDB"), "utf8"));
let lflist = JSON.parse(fs.readFileSync("config/" + config.getConfig("lflistDB"), "utf8"));
let stats = JSON.parse(fs.readFileSync("config/" + config.getConfig("statsDB"), "utf8"));
let strings = JSON.parse(fs.readFileSync("config/" + config.getConfig("stringsDB"),"utf8"));

let libFunctions;
let libConstants;
let libParams;

let Card = require("./card.js")(setcodes); //initialises a "Card" Class, takes setcodes as an argument for handling archetypes as a class function

setInterval(() => {
	fs.writeFileSync("config/" + config.getConfig("statsDB"), JSON.stringify(stats), "utf8");
	console.log("Stats saved!");
}, 300000); //5 minutes

//discord setup 
const Discord = require("discord.io");

let bot = new Discord.Client({
	token: config.getConfig("token"),
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
const SQL = require("sql.js");
let cards = {};
let nameList = {};

//fuse setup
const Fuse = require("fuse.js");
let fuse = {};
let skillFuse = {};

let skills = [];
let skillNames = [];

const gstojson = require("google-spreadsheet-to-json");

const request = require("request");
const https = require("https");
const url = require("url");
const jimp = require("jimp");
const filetype = require("file-type");

let updateFuncs = [];
if (config.getConfig("sheetsDB"))
	updateFuncs.push(updatejson);
else
	setJSON();
if (config.getConfig("setcodeSource"))
	updateFuncs.push(updateSetcodes);
if (config.getConfig("updateRepos"))
	updateFuncs.push(dbUpdate);
else 
	loadDBs();
if (config.getConfig("lflistSource"))
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
	for (let lang of Object.keys(dbs)) {
		if (!(lang in strings)) {
			strings[lang] = {};
		}
		let en = config.getConfig("defaultLanguage");
		Object.keys(strings[en]).forEach(key => {
			if (!(key in strings[lang]) || strings[lang][key].trim().length === 0) {
				strings[lang][key] = strings[en][key];
			}
		});
	}
});

//these are used for various data that needs to persist between commands or uses of a command
let longMsg = "";
let gameData = {};
let searchPage = {};
let matchPage = {};
let matchLangs = {};

//command declaration
let commandList = [{
	names: ["randcard", "randomcard"],
	func: randomCard,
	desc: "Display the description of a random card. See the readme for how you can filter what kind of card it shows."
},
{
	names: ["script"],
	func: script,
	chk: () => config.getConfig("scriptUrl"),
	desc: "Displays the script of a card."
},
{
	names: ["trivia", "game", "guess"],
	func: trivia,
	chk: () => config.getConfig("imageUrl"),
	desc: "Plays a game where you guess the name of a card by its artwork."
},
{
	names: ["tlock"],
	func: tlock,
	chk: (user, userID, channelID) => config.getConfig("imageUrl") && checkForPermissions(userID, channelID, ["TEXT_MANAGE_MESSAGES"]), //User must have manage message permission
	desc: "Adds the current channel to a list of which trivia can only be played in channels from."
},
{
	names: ["config", "setconfig"],
	func: setConf,
	chk: (user, userID, channelID) => checkForPermissions(userID, channelID, ["TEXT_MANAGE_MESSAGES"]),
	desc: "Configures certain options about how the bot runs, local to the server. See readme for more info."
},
{
	names: ["matches", "match"],
	func: matches,
	chk: (user, userID, channelID) => !(channelID in gameData),
	desc: "Returns the top 10 cards with names similar to the text entered."
},
{
	names: ["search", "textsearch", "searchtext"],
	func: textSearch,
	desc: "Returns 10 cards that include the given phrase in their card text."
},
{
	names: ["viewmatch"],
	func: viewMatch,
	chk: (user, userID, channelID) => channelID in matchPage,
	desc: "Returns the card profile for a result from the .matches or .search commands."
},
{
	names: ["set", "setcode", "archetype", "setname", "sets"],
	func: set,
	desc: "Converts between YGOPro setcodes and archetype names."
},
{
	names: ["counter", "count", "ct"],
	func: counter,
	desc: "Converts between YGOPro hex codes and Counter names."
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
	names: ["price"],
	func: getSingleProp,
	chk: (user, userID, channelID) => !(channelID in gameData),
	desc: "Displays the price of a card, without any other detail."
},
{
	names: ["strings"],
	func: stringsearch,
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
	chk: () => config.getConfig("scriptFunctions"),
	desc: "Searches for functions used in YGOPro scripting."
},
{
	names: ["constant", "const", "c"],
	func: searchConstants,
	chk: () => config.getConfig("scriptConstants"),
	desc: "Searches for constants used in YGOPro scripting."
},
{
	names: ["param", "parameter"],
	func: searchParams,
	chk: () => config.getConfig("scriptParams"),
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
	names: ["dbfind"],
	func: dbFind,
	desc: "Returns the name of the database the given card's information is stored in."
},
{
	names: ["servers", "serverlist"],
	func: servers,
	chk: (user, userID) => {
		let owner = config.getConfig("botOwner");
		return owner && owner.includes(userID);
	},
	noTrack: true,
	desc: "Generates a list of servers the bot is in."
},
{
	names: ["eval", "ownereval"],
	func: ownerEval,
	chk: (user, userID) => {
		let owner = config.getConfig("botOwner");
		return owner && owner.includes(userID);
	},
	noTrack: true,
	desc: "Executes arbitrary JavaScript code for testing. USE WITH CAUTION."
},
{
	names: ["update", "updatejson"],
	func: (user, userID, channelID, message, event) => {
		sendMessage(user, userID, channelID, message, event, "Starting update!").catch(msgErrHandler);
		periodicUpdate().then(() => sendMessage(user, userID, channelID, message, event, "Update complete!").catch(msgErrHandler)).catch(e => sendMessage(user, userID, userID, message, event, e).catch(msgErrHandler));
	},
	chk: (user, userID) => {
		let owner = config.getConfig("botOwner");
		return owner && owner.includes(userID);
	},
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
},
{
	names: ["ygoprodeck", "ydeck", "ygodeck", "prodeck"],
	func: proDeck,
	desc: "Links the YGOProDeck database page for a given card."
},
{
	names: ["tfix", "triviafix", "fixtrivia"],
	func: triviaFix,
	chk: (user, userID, channelID) => channelID in gameData,
	desc: "Clears the trivia data for the current channel, fixing issues when it freezes."
}];

let helpCooldown = true;

function cmdCheck(name, mes, nameList, pre) {
	for (let nam of nameList) {
		if (nam !== name && (pre + nam) === mes) { //checks if another alias in the name list is an exact match
			return false; //in which case it won't execute the command based off the shorter alias, waiting for the full match
		}
	}
	return true;
}

bot.on("message", (user, userID, channelID, message, event) => {
	if (userID === bot.id || (bot.users[userID] && bot.users[userID].bot)) { //ignores own messages to prevent loops, and those of other bots just in case
		return;
	}
	let lowMessage = message.toLowerCase();
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let pre = config.getConfig("prefix", serverID);
	for (let cmd of commandList) {
		for (let name of cmd.names) {
			if (lowMessage.startsWith(pre + name) && cmdCheck(name, lowMessage.split(" ")[0], cmd.names, pre) && (!cmd.chk || cmd.chk(user, userID, channelID, message, event))) {
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
		sendMessage(user, userID, channelID, message, event, config.getConfig("helpMessage")).catch(msgErrHandler);
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
	if (config.getConfig("imageUrl")) {
		let re2 = /<(.*?)>/g; //gets text between <>
		let regx2;
		do {
			regx2 = re2.exec(message);
			if (regx2 && validateReg(regx2[1]))
				results2.push(regx2[1]);
		} while (regx2);
	}
	let maxSearches = config.getConfig("maxSearches", serverID);
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
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let pre = config.getConfig("prefix", serverID);
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

async function commands(user, userID, channelID, message, event) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let pre = config.getConfig("prefix", serverID);
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
	let outArr = [out];
	let outIndex = 0;
	while (outArr[outIndex].length > 2000) {
		let index = outArr[outIndex].length - 1;
		while (outArr[outIndex].slice(0,index).length > 2000) {
			index--;
			while (outArr[outIndex][index - 1] !== "\n") {
				index--;
			}
		}
		outArr.push(outArr[outIndex].slice(index));
		outArr[outIndex] = outArr[outIndex].slice(0,index);
		outIndex++;
	}
	for (let msg of outArr) {
		await sendMessage(user, userID, userID, message, event, msg).catch(msgErrHandler);
	}
}

async function randomCard(user, userID, channelID, message, event) { //anything that gets card data has to be async because getting the price involves a Promise
	try {
		let args = message.toLowerCase().split(" ");
		let code;
		let outLang = config.getConfig("defaultLanguage");
		for (let arg of args) {
			if (arg in dbs) {
				outLang = arg;
			}
		}
		let ids = Object.keys(cards[outLang]);
		let argObj = parseFilterArgs(message.toLowerCase());
		if (Object.keys(argObj).length > 0) {
			let matches = [];
			for (let id of ids) { //gets a list of all cards that meet specified criteria, before getting a random one of those cards
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
		sendCardProfile(user, userID, channelID, message, event, code, outLang, args.indexOf("image") > -1);
	} catch (e) {
		console.error(e);
	}
}

//from hereon out, some functions and logic will be re-used from earlier functions - I won't repeat myself, just check that.
async function script(user, userID, channelID, message, event, name) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let input = message.slice((config.getConfig("prefix", serverID) + name + " ").length);
	let args = input.split("|");
	let inLang = config.getConfig("defaultLanguage");
	if (args.length > 1) {
		input = args[0];
		if (args[1] in dbs)
			inLang = args[1];
	}
	let inInt = parseInt(input);
	if (inInt in cards[inLang]) {
		try {
			let out = await getCardScript(cards[inLang][inInt]);
			sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
		} catch (e) {
			console.error("Error with search by ID:");
			console.error(e);
		}
	} else { //if it wasn't an ID, the only remaining valid option is that it's a name
		try {
			let code = nameCheck(input, inLang); //this handles all the fuzzy search stuff
			if (code && code in cards[inLang]) {
				getCardScript(cards[inLang][code]).then(out => sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler));
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
	let defaultLanguage = config.getConfig("defaultLanguage");
	if (inLang in dbs && outLang in dbs) {
		input = args.splice(0, args.length - 2).join(",");
	} else {
		inLang = defaultLanguage;
		outLang = defaultLanguage;
	}
	let inInt = parseInt(input);
	if (inInt in cards[inLang]) {
		sendCardProfile(user, userID, channelID, message, event, inInt, outLang, hasImage);
	} else {
		try {
			let code = nameCheck(input, inLang);
			if (code && code in cards[outLang]) {
				sendCardProfile(user, userID, channelID, message, event, code, outLang, hasImage);
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

function getPrice(code, outLang) {
	return new Promise((resolve, reject) => {
		if (outLang === "ja") {
			request("https://ocg.xpg.jp/search/search.fcgi?Name=" + code + "&Mode=0&Price=1", (error, response, body) => {
				if (error) {
					reject(error);
				} else if (response.statusCode === 200) {
					let re = /<td>([0-9]+)円<\/td><td>([0-9]+)円<\/td>/g;
					let match = re.exec(body);
					if (match === null) {
						reject();
					} else {
						resolve("最安: " + match[1] + "円, ﾄﾘﾑ平均: " + match[2] + "円");
					}
				} else {
					reject();
				}
			});
		} else {
			let card = cards[outLang][code];
			request("https://yugiohprices.com/api/get_card_prices/" + card.name, (error, response, body) => { //https://yugiohprices.docs.apiary.io/#reference/checking-card-prices/check-price-for-card-name/check-price-for-card-name
				if (error) {
					reject(error);
				} else if (response.statusCode === 200 && JSON.parse(body).status === "success") {
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
					if (low && hi) {
						if (avgs.length > 0) {
							let avg = (avgs.reduce((a, b) => a + b, 0)) / avgs.length;
							resolve("$" + low.toFixed(2) + "-$" + avg.toFixed(2) + "-$" + hi.toFixed(2) + " USD\n");
						} else {
							resolve("$" + low.toFixed(2) + "-$" + hi.toFixed(2) + " USD\n");
						}
					} else {
						reject();
					}
				} else {
					reject();
				}
			});
		}
	});
}

function getCardInfo(code, outLang, serverID) {
	return new Promise(async (resolve, reject) => {
		if (!code || !cards[outLang][code]) {
			console.error("Invalid card ID, please try again.");
			reject("Invalid card ID, please try again.");
		}
		let out = {};
		let card = cards[outLang][code];
		out.alIDs = [code];
		let emoteMode = config.getConfig("emoteMode", serverID);
		let emotesDB = config.emotesDB;
		if (card.alias > 0 && cards[outLang][card.alias]) { //if the card has an alias, e.g. IS the alt art
			let alCard = cards[outLang][card.alias];
			if (card.hasSameOT(alCard) && card.name === alCard.name) { //If the card with the alias is the same OT as the card with the base ID, then it's an alt art as opposed to an anime version or pre-errata or something. However if the name is different it's a Fusion Sub or Harpie Lady.
				code = alCard.code;
				out.alIDs = [code];
				Object.values(cards[outLang]).forEach(tempCard => {
					if (tempCard.alias === code && tempCard.hasSameOT(alCard)) {
						out.alIDs.push(tempCard.code);
					}
				});
			}
		} else { //if other cards have this, the original, as an alias, they'll be noted here
			Object.values(cards[outLang]).forEach(tempCard => {
				if (tempCard.alias === code && tempCard.hasSameOT(card) && tempCard.name === card.name) {
					out.alIDs.push(tempCard.code);
				}
			});
		}
		out.stats = "** " + strings[outLang].id + "**: " + out.alIDs.join("|") + "\n";
		if (card.sets) {
			out.stats += "**" + strings[outLang].archetype + "**: " + card.sets.join(", ");
		}
		out.stats += "\n";
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
		try {
			let price = await getPrice(code, outLang);
			out.stats += "**" + strings[outLang].ot + "**: " + stat + " **" + strings[outLang].price + "**: " + price + "\n";
			out.price = price;
		} catch (e) {
			out.stats += "**" + strings[outLang].ot + "**: " + stat + "\n";
		}
		out.embCT = getEmbCT(card);
		if (card.types.includes("Monster")) {
			let arrace = addEmote(card.race, "|", serverID);
			let typesStr;
			if (emoteMode < 2) {
				typesStr = card.types.join("/").replace("Monster", arrace[emoteMode]);
			} else {
				typesStr = card.types.join("/").replace("Monster", arrace[0]);
				typesStr += " " + arrace[1];
			}
			out.stats += "**" + strings[outLang].type + "**: " + typesStr + " **" + strings[outLang].att + "**: " + addEmote(card.attribute, "|", serverID)[emoteMode] + "\n";
			let lvName = strings[outLang].lv;
			if (card.types.includes("Xyz")) {
				lvName = strings[outLang].rank;
			} else if (card.types.includes("Link")) {
				lvName = strings[outLang].linkr;
			}
			out.stats += "**" + lvName + "**: " + card.level + " ";
			if (emoteMode > 0) {
				if (card.isType(0x1000000000)) { //is dark synchro
					out.stats += emotesDB["NLevel"] + " ";
				} else {
					let en = config.getConfig("defaultLanguage", serverID);
					out.stats += emotesDB[strings[en].lv] + " ";
				}
			}
			out.stats += " **" + strings[outLang].atk + "**: " + card.atk + " ";
			if (card.def) {
				out.stats += "**" + strings[outLang].def + "**: " + card.def;
			} else {
				out.stats += "**" + strings[outLang].arrow + "**: " + card.markers;
			}
			if (card.types.includes("Pendulum")) {
				out.stats += " **" + strings[outLang].scale + "**: ";
				if (emoteMode > 0) {
					out.stats += " " + card.lscale + emotesDB["L.Scale"] + " " + emotesDB["R.Scale"] + card.rscale + " ";
				} else {
					out.stats += card.lscale + "/" + card.rscale;
				}
			}
			let cardText = card.desc;
			if (cardText.length === 4) {
				out.pHeading = cardText[2];
				out.pText = cardText[0];
				out.mHeading = cardText[3];
				out.mText = cardText[1];
			} else {
				if (card.types.includes("Normal")) {
					out.mHeading = "Flavour Text";
				} else {
					out.mHeading = strings[outLang].meffect;
				}
				out.mText = cardText[0];
			}
		} else if (card.types.includes("Spell") || card.types.includes("Trap")) {
			let typeemote = addEmote(card.types, "/", serverID);
			if ((typeemote[0] == "Spell" || typeemote[0] == "Trap") && emoteMode > 0) {
				typeemote[1] += emotesDB["NormalST"];
				typeemote[2] += emotesDB["NormalST"];
			}
			if (card.isType(0x100)) { //is trap monster
				let arrace = addEmote(card.race, "|", serverID);
				let typesStr;
				if (emoteMode < 2) {
					typesStr = arrace[emoteMode] + "/" + typeemote[emoteMode];
				} else {
					typesStr = arrace[0] + "/" + typeemote[0];
					typesStr += " " + arrace[1] + typeemote[1];
				}
				out.stats += "**" + strings[outLang].type + "**: " + typesStr + " **" + strings[outLang].att + "**: " + addEmote(card.attribute, "|", serverID)[emoteMode] + "\n**" + strings[outLang].lv + "**: " + card.level;
				if (emoteMode > 0) {
					out.stats += " " + emotesDB["Level"];
				}
				out.stats += "  **ATK**: " + card.atk + " **DEF**: " + card.def + "\n";
			} else {
				out.stats += "**" + strings[outLang].type + "**: " + typeemote[emoteMode];
			}
			out.mHeading = strings[outLang].effect;
			out.mText = card.desc[0].replace(/\n/g, "\n"); //replaces literal new lines that Discord doesn't recognise with a newline character that it does. I know this looks silly.
		} else {
			out.mHeading = strings[outLang].text;
			out.mText = card.desc[0].replace(/\n/g, "\n");
		}
		let re = /DoItYourself---(.+)/;
		let match = re.exec(out.mText);
		if (match !== null) {
			out.mText = out.mText.replace(re,"");
			out.mText += "\n**Creator**: " + match[1];
		}
		resolve(out);
	});
}

async function getImage(code, outLang, user, userID, channelID, message, event) {
	try {
		let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
		let imageUrl = config.getConfig("imageUrl");
		let imageSize = config.getConfig("imageSize", serverID);
		let imageExt = config.getConfig("imageExt");
		let card = cards[outLang][code[0]];
		if (card.isAnime) {
			imageUrl = config.getConfig("imageUrlAnime");
		}
		if (card.isCustom) {
			imageUrl = config.getConfig("imageUrlCustom");
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
			return buffer;
		} else {
			let buffer = await downloadImage(imageUrl + code[0] + "." + imageExt, serverID);
			return buffer;
		}
	} catch (e) {
		console.error(e);
	}

}

function downloadImage(imageUrl, serverID) {
	return new Promise((resolve, reject) => {
		if (config.getConfig("debugOutput")) {
			console.log("Debug Data: " + imageUrl);
			console.dir(url.parse(imageUrl));
		}
		https.get(url.parse(imageUrl), response => {
			let data = [];
			response.on("data", chunk => {
				data.push(chunk);
			}).on("end", () => {
				let buffer = Buffer.concat(data);
				if (filetype(buffer) && filetype(buffer).ext === config.getConfig("imageExt")) {
					jimp.read(buffer, (err, image) => {
						if (err) {
							reject(err);
						} else {
							image.resize(jimp.AUTO, config.getConfig("imageSize", serverID));
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
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let input = message.slice((config.getConfig("prefix", serverID) + name + " ").length);
	let args = input.split("|");
	let outLang = config.getConfig("defaultLanguage");
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
		let cardData = await getCardInfo(code, outLang, serverID);
		let cardName = cards[outLang][code].name;
		let out = "";
		switch (prop) {
		case "id":
			out = "**" + cardName + "**: " + cardData.alIDs.join("|");
			break;
		case "notext":
			out = "__**" + cardName + "**__\n" + cardData.stats;
			break;
		case "effect":
			out = "__**" + cardName + "**__\n";
			if (cardData.pHeading) {
				out += "**" + cardData.pHeading + "**: " + cardData.pText + "\n";
			}
			out += "**" + cardData.mHeading + "**: " + cardData.mText;
			break;
		case "price":
			if (cardData.price) {
				out = "**" + cardName + "**: " + cardData.price;
			} else {
				out = "Sorry, I could not find a price for " + cardName + "!";
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
	let outLang = config.getConfig("defaultLanguage");
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
			let outArr = [out];
			let outIndex = 0;
			while (outArr[outIndex].length > 2000) {
				let index = outArr[outIndex].length - 1;
				while (outArr[outIndex].slice(0,index).length > 2000) {
					index--;
					while (outArr[outIndex][index - 1] !== "\n") {
						index--;
					}
				}
				outArr.push(outArr[outIndex].slice(index));
				outArr[outIndex] = outArr[outIndex].slice(0,index);
				outIndex++;
			}
			for (let msg of outArr) {
				await sendMessage(user, userID, userID, message, event, msg).catch(msgErrHandler);
			}
		});
	});
}

function downloadScript(file) {
	return new Promise(resolve => {
		https.get(url.parse(file.data.download_url), response => {
			let data = [];
			response.on("data", chunk => {
				data.push(chunk);
			}).on("end", () => {
				resolve(Buffer.concat(data));
			});
		});
	});
}

function getGHCardScript(card, scriptUrl) {
	return new Promise((resolve, reject) => {
		let arr = scriptUrl.split("/");
		if (!arr || arr.length < 2)
			reject("Invalid card script source: " + scriptUrl);
		else {
			let path;
			if (arr.length > 2) {
				path = arr.slice(2).join("/") + "/c" + card.code + ".lua";
			} else {
				path = "/c" + card.code + ".lua";
			}
			github.repos.getContent({
				owner: arr[0],
				repo: arr[1],
				path: path
			}, (err, file) => {
				if (err) {
					reject(err);
				} else {
					downloadScript(file).then(buffer => {
						resolve({
							script: buffer.toString(),
							file: file
						});
					});
				}
			});
		}
	});
}

function getCardScript(card) {
	return new Promise((resolve, reject) => {
		let scriptUrl = config.getConfig("scriptUrl");
		if (card.isAnime) {
			scriptUrl = config.getConfig("scriptUrlAnime");
		}
		if (card.isCustom) {
			scriptUrl = config.getConfig("scriptUrlCustom");
		}
		getGHCardScript(card, scriptUrl).then(res => {
			let scriptArr = res.script.split("\n");
			let script = "";
			scriptArr.forEach((key, index) => {
				script += " ".repeat(scriptArr.length.toString().length - (index + 1).toString().length) + (index + 1) + "| " + scriptArr[index] + "\n"; //appends properly space-padded line numbers at start of lines
			});
			if (script.length + "```lua\n```\n".length + res.file.data.html_url.length > 2000) { //display script if it fits, otherwise just link to it
				resolve(res.file.data.html_url);
			} else {
				resolve("```lua\n" + script + "```\n" + res.file.data.html_url);
			}
		}).catch(async e => {
			let scriptUrlBackup = config.getConfig("scriptUrlBackup");
			let err = e;
			let res; 
			if (err.code === 404 && scriptUrlBackup) {
				let i = 0;
				while (err.code === 404 && i in scriptUrlBackup) {
					await getGHCardScript(card, scriptUrlBackup[i]).then(scr => {
						res = scr;
						err = {code: -1};
						i++; //this success should end the loop by the first statement, but better to be sure
					}).catch(e => {
						err = e;
						i++;
					});
				}
				if (res) {
					let scriptArr = res.script.split("\n");
					let script = "";
					scriptArr.forEach((key, index) => {
						script += " ".repeat(scriptArr.length.toString().length - (index + 1).toString().length) + (index + 1) + "| " + scriptArr[index] + "\n"; //appends properly space-padded line numbers at start of lines
					});
					if (script.length + "```lua\n```\n".length + res.file.data.html_url.length > 2000) { //display script if it fits, otherwise just link to it
						resolve(res.file.data.html_url);
					} else {
						resolve("```lua\n" + script + "```\n" + res.file.data.html_url);
					}
				} else {
					reject(err);
				}	
			} else {
				reject(e);
			}
		});
	});
}

function matches(user, userID, channelID, message, event, name) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let a = message.toLowerCase().split("|");
	let arg = a[0].slice((config.getConfig("prefix", serverID) + name + " ").length);
	let args = a[1] && a[1].split(" ");
	let outLang = config.getConfig("defaultLanguage");
	let num = 10;
	if (args) {
		for (let ar of args) {
			if (ar in dbs) {
				outLang = ar;
			}
			if (ar.toLowerCase().startsWith("count:")) {
				num = parseInt(ar.slice("count:".length));
				if (num > config.getConfig("maxSearches", serverID) * 10) {
					num = config.getConfig("maxSearches", serverID) * 10;
				}
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
	let argObj;
	if (args) {
		argObj = parseFilterArgs(a[1]);
	}
	if (arg.length > 0) {
		let results = fuse[outLang].search(arg);
		if (results.length < 1) {
			sendMessage(user, userID, channelID, message, event, "No matches found!").catch(msgErrHandler);
		} else {
			let i = 0;
			let outs = [];
			while (i in results && outs.length < num) {
				if (results[i].item.id in cards[outLang]) {
					if (aliasCheck(results[i].item.id, outLang) && (!argObj || randFilterCheck(results[i].item.id, argObj, outLang))) {
						outs.push(results[i].item.id);
					}
				}
				i++;
			}
			if (outs.length < num) {
				num = outs.length;
			}
			let out = "Top " + num + " card name matches for **`" + arg + "`**:";
			outs.forEach((code, i) => {
				out += "\n" + (i + 1) + ". " + cards[outLang][code].name;
			});
			matchPage[channelID] = outs;
			matchLangs[channelID] = outLang;
			sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
		}
	} else if (argObj) {
		let i = 0;
		let outs = [];
		let cardList = Object.values(cards[outLang]);
		while (i in cardList && outs.length < num) {
			if (aliasCheck(cardList[i].code, outLang) && randFilterCheck(cardList[i].code, argObj, outLang)) {
				outs.push(cardList[i].code);
			}
			i++;
		}
		if (outs.length < num) {
			num = outs.length;
		}
		let out = num + " cards that meet your criteria:";
		outs.forEach((code, i) => {
			out += "\n" + (i + 1) + ". " + cards[outLang][code].name;
		});
		matchPage[channelID] = outs;
		matchLangs[channelID] = outLang;
		sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
	} else {
		sendMessage(user, userID, channelID, message, event, "No matches found!").catch(msgErrHandler);
	} 
}

function textSearch(user, userID, channelID, message, event, name) {
	let a = message.toLowerCase().split("|");
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let arg = a[0].slice((config.getConfig("prefix", serverID) + name + " ").length).toLowerCase();
	let args = a[1] && a[1].split(" ");
	let outLang = config.getConfig("defaultLanguage");
	let num = 10;
	if (args) {
		for (let ar of args) {
			if (ar in dbs) {
				outLang = ar;
			}
			if (ar.toLowerCase().startsWith("count:")) {
				num = parseInt(ar.slice("count:".length));
				if (num > config.getConfig("maxSearches", serverID) * 10) {
					num = config.getConfig("maxSearches", serverID) * 10;
				}
			}
		}
	}
	let argObj;
	if (args) {
		argObj = parseFilterArgs(a[1]);
	}
	let results = [];
	Object.values(cards[outLang]).forEach(card => {
		if (card.desc.length === 4) {
			if (card.desc[1].toLowerCase().includes(arg) && results.indexOf(card.code) === -1) {
				results.push(card.code);
			}
		}
		if (card.desc[0].toLowerCase().includes(arg) && results.indexOf(card.code) === -1) {
			results.push(card.code);
		}
		if (card.name.toLowerCase().includes(arg) && results.indexOf(card.code) === -1) {
			results.push(card.code);
		}
	});
	if (results.length < 1) {
		sendMessage(user, userID, channelID, message, event, "No matches found!").catch(msgErrHandler);
	} else {
		let i = 0;
		let outs = [];
		while (i in results && outs.length < num) {
			if (results[i] in cards[outLang]) {
				if (aliasCheck(results[i], outLang) && (!argObj || randFilterCheck(results[i], argObj, outLang))) {
					outs.push(results[i]);
				}
			}
			i++;
		}
		if (outs.length < num) {
			num = outs.length;
		}
		let out = num + " card text matches for **`" + arg + "`**:";
		outs.forEach((code, i) => {
			out += "\n" + (i + 1) + ". " + cards[outLang][code].name;
		});
		matchPage[channelID] = outs;
		matchLangs[channelID] = outLang;
		sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
	}
}

function viewMatch(user, userID, channelID, message, event, name) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let arg = message.slice((config.getConfig("prefix", serverID) + name + " ").length);
	let argInt = parseInt(arg);
	if (channelID in matchPage && !isNaN(argInt) && (argInt - 1) in matchPage[channelID]) {
		let searchTerm = matchPage[channelID][argInt - 1].toString();
		if (channelID in matchLangs) {
			searchTerm += "," + matchLangs[channelID] + "," + matchLangs[channelID];
		}
		searchCard(searchTerm, false, user, userID, channelID, message, event);
	}
}

function set(user, userID, channelID, message, event, name) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let arg = message.slice((config.getConfig("prefix", serverID) + name + " ").length);
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

function counter(user, userID, channelID, message, event, name) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let arg = message.slice((config.getConfig("prefix", serverID) + name + " ").length);
	if (arg.toLowerCase() in counters) {
		sendMessage(user, userID, channelID, message, event, counters[arg.toLowerCase()] + ": " + arg).catch(msgErrHandler);
	} else {
		Object.keys(counters).forEach(key => {
			if (counters[key].toLowerCase() === arg.toLowerCase()) {
				sendMessage(user, userID, channelID, message, event, counters[key] + ": " + key).catch(msgErrHandler);
				return;
			}
		});
	}
}

function searchSkill(user, userID, channelID, message, event, name) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let arg = message.toLowerCase().slice((config.getConfig("prefix", serverID) + name + " ").length);
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
		sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
	} else {
		console.log("No skill found for search '" + arg + "'!");
	}
}

function dbFind(user, userID, channelID, message, event, name) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let input = message.slice((config.getConfig("prefix", serverID) + name + " ").length);
	let args = input.split("|");
	let outLang = config.getConfig("defaultLanguage");
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
		sendMessage(user, userID, channelID, message, event, "**" + card.name + "**'s entry can be found in the following databases: `" + card.db.join("`, `") + "`!\nThe rightmost database's entry is the one currently in use.").catch(msgErrHandler);
	} else {
		console.error("DB Find failed! Debug info: ");
		console.error("code: " + code);
		console.error("input: " + input);
		console.error("server: " + bot.servers[serverID].name);
		console.error("channel: " + bot.channels[channelID].name);
		console.error("user: " + user);
	}
}

function stringsearch(user, userID, channelID, message, event, name) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let input = message.slice((config.getConfig("prefix", serverID) + name + " ").length);
	let args = input.split("|");
	let inLang = config.getConfig("defaultLanguage");
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
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let input = message.slice((config.getConfig("prefix", serverID) + name + " ").length);
	let args = input.split("|");
	let inLang = config.getConfig("defaultLanguage");
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
		let rulingLang = config.getConfig("rulingLanguage");
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
				out += "<" + encodeURI(jUrl) + ">\nClick the appropriate search result, then the yellow button that reads \"このカードのＱ＆Ａを表示\"";
			}
		} else {
			out = e;
		}
	});
	sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
}

function rankings(user, userID, channelID, message, event) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let args = message.split(" ");
	let term = "cards";
	let validTerms = ["cards", "inputs", "commands"];
	let numToGet = -1;
	let outLang = config.getConfig("defaultLanguage");
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
					tempVal = "`" + config.getConfig("prefix", serverID) + tempVal + "`";
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

async function banlist(user, userID, channelID, message, event, name) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let defaultLanguage = config.getConfig("defaultLanguage");
	let input = message.slice((config.getConfig("prefix", serverID) + name + " ").length);
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
					let card = cards[defaultLanguage][parseInt(code)];
					if (card)
						out += card.name + "\n";
					else
						out += code + "\n";
				}
			}
			if (limArr.length > 0) {
				out += "**Limited**\n";
				for (let code of limArr) {
					let card = cards[defaultLanguage][parseInt(code)];
					if (card)
						out += card.name + "\n";
					else
						out += code + "\n";
				}
			}
			if (semArr.length > 0) {
				out += "**Semi-Limited**\n";
				for (let code of semArr) {
					let card = cards[defaultLanguage][parseInt(code)];
					if (card)
						out += card.name + "\n";
					else
						out += code + "\n";
				}
			}
			let outArr = [out];
			let outIndex = 0;
			while (outArr[outIndex].length > 2000) {
				let index = outArr[outIndex].length - 1;
				while (outArr[outIndex].slice(0,index).length > 2000) {
					index--;
					while (outArr[outIndex][index - 1] !== "\n") {
						index--;
					}
				}
				outArr.push(outArr[outIndex].slice(index));
				outArr[outIndex] = outArr[outIndex].slice(0,index);
				outIndex++;
			}
			for (let msg of outArr) {
				await sendMessage(user, userID, userID, message, event, msg).catch(msgErrHandler);
			}
			return;
		}
	}
	sendMessage(user, userID, channelID, message, event, "Sorry, I couldn't find a banlist named `" + input + "`!").catch(msgErrHandler);
}

function banlink(user, userID, channelID, message, event, name) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let input = message.slice((config.getConfig("prefix", serverID) + name + " ").length);
	let out;
	switch (input.toLowerCase()) {
	case "tcg": out = "http://www.yugioh-card.com/en/limited/"; break;
	case "ocg": out = "http://www.yugioh-card.com/my/event/rules_guides/forbidden_cardlist.php?list=201801&lang=en"; break;
	default: return;
	}
	sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
}

function yugi(user, userID, channelID, message, event, name) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let input = message.slice((config.getConfig("prefix", serverID) + name + " ").length);
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

function proDeck(user, userID, channelID, message, event, name) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let input = message.slice((config.getConfig("prefix", serverID) + name + " ").length);
	let args = input.split("|");
	let inLang = config.getConfig("defaultLanguage");
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
	let engName = cards[config.getConfig("defaultLanguage")][code].name;
	sendMessage(user, userID, channelID, message, event, "https://db.ygoprodeck.com/card/?search=" + encodeURI(engName));	
}

function setConf(user, userID, channelID, message, event) {
	let args = message.split(" ");
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	if (serverID) {
		let fieldName = args[1];
		let val = args[2];
		if (Conf.fieldList[fieldName] != null && Conf.fieldList[fieldName].configable) {
			if (config.setConfig(fieldName, val, serverID)) {
				let out = "Value of `" + fieldName + "` successfully set to `" + args[2] + "`!";
				if (val == null)
					out = "Value of `" + fieldName + "` successfully reverted to default of `" + config.getConfig(fieldName) + "`!";
				sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
			} else {
				let out = "Sorry, but something went wrong setting the value of `" + fieldName + "` to `" + args[2] + "`! `" + args[2] + "` might have been an invalid value, see the readme for instructions on using this command.";
				if (val == null)
					out = "Sorry, but something went wrong reverting the value of `" + fieldName + "` to default! Perhaps it had not been set for this server?";
				sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
			}
		} else {
			sendMessage(user, userID, channelID, message, event, "Sorry, but `" + fieldName + "` isn't the name of a config field that can be configured per-server. Keep in mind config fields are case sensitive. See the readme for a list of valid fields!").catch(msgErrHandler);
		}
	} else {
		sendMessage(user, userID, channelID, message, event, "Sorry, but I can't get the ID of the current server. This command does not work in Direct Messages.").catch(msgErrHandler);
	}
}

//utility functions
async function sendCardProfile(user, userID, channelID, message, event, code, outLang, hasImage) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let alID = getBaseID(cards[outLang][code], outLang); //determines if the card should be tracked by its own ID, or its alias, and returns the appropriate ID.
	if (alID > -1) {
		if (stats.searchRankings[alID]) {
			stats.searchRankings[alID]++;
		} else {
			stats.searchRankings[alID] = 1;
		}
	}
	let cardData = await getCardInfo(code, outLang, serverID);
	let card = cards[outLang][code];
	if (config.getConfig("messageMode", serverID) > 0) {
		let tempColour = config.embcDB && cardData.embCT && config.embcDB[cardData.embCT] || config.getConfig("embedColour", serverID);
		let embed = {
			title: card.name,
			color: tempColour
		};
		let buffer;
		if (hasImage) {
			if (cardData.alIDs.length > 1) {
				buffer = await getImage(cardData.alIDs, outLang, user, userID, channelID, message, event);
			} else {
				let imgurl = config.getConfig("imageUrl");
				if (card.isAnime) {
					imgurl = config.getConfig("imageUrlAnime");
				}
				if (card.isCustom) {
					imgurl = config.getConfig("imageUrlCustom");
				}
				imgurl += code + "." + config.getConfig("imageExt");
				embed.thumbnail = {
					url: imgurl
				};
			}
		}
		embed.description = cardData.stats;
		embed.fields = [];
		if (cardData.pHeading) {
			embed.fields.push({
				name: cardData.pHeading,
				value: cardData.pText
			});
		}
		let text = cardData.mText;
		let longText;
		if (text.length > 1024) { //even though an embed's total content can be up to 6k charas, a field is capped to 1024 :/
			let index = 1024;
			while (text[index - 1] !== ".") {
				index--;
			}
			longText = text.slice(index);
			text = text.slice(0,index);
		}
		embed.fields.push({
			name: cardData.mHeading,
			value: text
		});
		let longTexts = [];
		while (longText && longText.length > 1024) {
			let index = 1024;
			while (longText[index - 1] !== ".") {
				index--;
			}
			longTexts.push(longText.slice(0,index));
			longText = longText.slice(index);
		}
		if (longText && longText.length > 0) {
			longTexts.push(longText);
		}
		if (longTexts.length > 0) {
			longTexts.forEach(t => embed.fields.push({name: "Continued", value: t }));
		}
		embed.fields.forEach((_,i) => { //uses key instead of value to modify original array
			if (embed.fields[i].value.trim().length < 1) {
				embed.fields[i].value = "[ no card text ]";
			}
		});
		sendProfileMessage(user, userID, channelID, message, event, null, embed, buffer, code + "." + config.getConfig("imageExt"));
	} else {
		let buffer;
		if (hasImage) {
			buffer = await getImage(cardData.alIDs, outLang, user, userID, channelID, message, event);
		}
		let out = "__**" + card.name + "**__\n";
		out += cardData.stats + "\n";
		if (cardData.pHeading) {
			out += "**" + cardData.pHeading + "**: " + cardData.pText + "\n";
		}

		let mText = "**" + cardData.mHeading + "**: " + cardData.mText;
		let longStr = config.getConfig("longStr");
		if (out.length + mText.length > 2000) {
			let index = mText.length - 1;
			while (out.length + mText.slice(0,index).length + longStr.length > 2000) {
				index--;
				while (mText[index - 1] !== ".") {
					index--;
				}
			}
			longMsg = mText.slice(index);
			out += mText.slice(0,index) + longStr;
		} else {
			out += mText;
		}
		sendProfileMessage(user, userID, channelID, message, event, out, null, buffer, code + "." + config.getConfig("imageExt")).catch(msgErrHandler);
	}
}

function sendProfileMessage(user, userID, channelID, message, event, desc, embed, buffer, filename) {
	return new Promise((resolve, reject) => {
		let sendObj = {
			to: channelID
		};
		if (embed) {
			sendObj.embed = embed;
		}
		if (desc) {
			sendObj.message = desc;
		}
		if (buffer) {
			bot.uploadFile({
				to: channelID,
				file: buffer,
				filename: filename
			}, err => {
				if (err) {
					if (err.response && err.response.retry_after) {
						setTimeout(() => {
							sendProfileMessage(user, userID, channelID, message, event, desc, embed, buffer, filename);
						}, err.response.retry_after + 1);
					} else {
						reject(err);
					}
				} else {
					bot.sendMessage(sendObj, (err, res) => {
						if (err) {
							if (err.response && err.response.retry_after) {
								setTimeout(() => {
									sendProfileMessage(user, userID, channelID, message, event, desc, embed);
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
		} else {
			bot.sendMessage(sendObj, (err, res) => {
				if (err) {
					if (err.response && err.response.retry_after) {
						setTimeout(() => {
							sendProfileMessage(user, userID, channelID, message, event, desc, embed);
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
		inLang = config.getConfig("defaultLanguage");
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

function addEmote(args, symbol, serverID) {
	let str = args.join(symbol);
	let emotes = "";
	let emoteMode = config.getConfig("emoteMode", serverID);
	if (emoteMode > 0) {
		for (let i = 0; i < args.length; i++) {
			emotes += config.emotesDB[args[i]];
		}
	}
	return [str, emotes, str + " " + emotes];
}

function setCheck(args, set) {
	for (let set2 of Card.setList) {
		if (set2.indexOf(set) > -1 && set2.length > set.length && args.indexOf(set2) > -1) {
			return false;
		} 
	}
	return true;
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
		"rank": {
			name: "level",
			func: arg => !isNaN(parseInt(arg)),
			convert: arg => parseInt(arg)
		},
		"link": {
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
		for (let set of Card.setList) {
			if (set.indexOf("/") > -1 && args.toLowerCase().indexOf(set) > -1 && setCheck(args, set)) { //looks for sets with slashes and fixes them up before splitting by slash. The practical reason for this is D/D/D
				let ind = args.toLowerCase().indexOf(set);
				args = args.slice(0, ind) + set.replace(/\//g,"THISISASLASH") + args.slice(ind + set.length);
			}
		}
		let ors = args.split("/");
		for (let arg of ors) {
			arg = arg.replace(/THISISASLASH/g, "/");
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

function aliasCheck(code, outLang) { //called when getting alt arts, checks if an aliased card has the same OT as the original
	let card = cards[outLang][code];
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
		let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
		if (!embColour)
			embColour = config.getConfig("embedColour", serverID);
		if (config.getConfig("messageMode", serverID) > 0) {
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
	return regx.length > 0 && regx.indexOf(":") !== 0 && regx.indexOf("a:") !== 0 && regx.indexOf("@") !== 0 && regx.indexOf("#") !== 0 && !regx.includes("http") && regx.length <= config.getConfig("fuseOptions").maxPatternLength;
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
	let triviaLocks = config.getConfig("triviaLocks", serverID);
	let triviaMaxRounds = config.getConfig("triviaMaxRounds", serverID);
	if (channelID in gameData || (triviaLocks[serverID] && triviaLocks[serverID].indexOf(channelID) === -1)) {
		return;
	} else {
		let outLang = config.getConfig("defaultLanguage");
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

function fixTriviaMessage(msg) {
	return msg.replace(/[\uff01-\uff5e]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)).replace(/[\s\-·∙•‧・･‐‑‒–—―﹘﹣－]/g,"").toLowerCase();
}

async function startTriviaRound(round, hard, outLang, argObj, user, userID, channelID, message, event) {
	try {
		let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
		let triviaTimeLimit = config.getConfig("triviaTimeLimit", serverID);
		let triviaHintTime = config.getConfig("triviaHintTime", serverID);
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
			for (let id of ids) { //gets a list of all cards that meet specified criteria, before getting a random one of those cards
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
		let imageExt = config.getConfig("imageExt");
		do {
			code = matches[Math.floor(Math.random() * matches.length)];
			card = cards[outLang][code];
			name = card.name;
			let imageUrl = config.getConfig("imageUrl");
			if (card.isAnime) {
				imageUrl = config.getConfig("imageUrlAnime");
			}
			if (card.isCustom) {
				imageUrl = config.getConfig("imageUrlCustom");
			}
			buffer = await new Promise(resolve => {
				if (config.getConfig("debugOutput")) {
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
			filename: "triviaPic." + imageExt
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
						let tempColour = parseInt("0x" + red + green + "00");
						if (config.getConfig("messageMode", serverID) > 0) {
							bot.editMessage({
								channelID: channelID,
								messageID: messageID,
								embed: {
									color: tempColour,
									description: "Can you name this card? Time remaining: `" + i + "`",
								}
							});
							tempColour += 0x300 - 0x1000;
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
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let pre = config.getConfig("prefix", serverID);
	let out;
	let thumbsup = "👍";
	let thumbsdown;
	if (config.getConfig("emoteMode") > 0) {
		thumbsup = config.emotesDB["thumbsup"];
		thumbsdown = config.emotesDB["thumbsdown"];
	}
	let fixMes = fixTriviaMessage(message);
	if (!fixMes.startsWith(pre + "tq") && !fixMes.startsWith(pre + "tskip") && !fixMes.includes(fixTriviaMessage(gameData[channelID].name))) {
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
	if (fixMes.startsWith(pre + "tq")) {
		out = "<@" + userID + "> quit the game. The answer was **" + gameData[channelID].name + "**!\n";
		out = triviaScore(out, user, userID, channelID, message, event);
		out = triviaWinners(out, user, userID, channelID, message, event);
		sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
		delete gameData[channelID];
	} else if (fixMes.startsWith(pre + "tskip")) {
		gameData[channelID].noAttCount = 0;
		out = "<@" + userID + "> skipped the round! The answer was **" + gameData[channelID].name + "**!\n";
		out = triviaScore(out, user, userID, channelID, message, event);
		sendMessage(user, userID, channelID, message, event, out).catch(msgErrHandler);
		startTriviaRound(gameData[channelID].round, gameData[channelID].hard, gameData[channelID].lang, gameData[channelID].argObj, user, userID, channelID, message, event);
	} else if (fixMes.includes(fixTriviaMessage(gameData[channelID].name))) {
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
			if (id in bot.users) {
				out += bot.users[id].username + ": " + gameData[channelID].score[id] + "\n";
			} else {
				out += id + ": " + gameData[channelID].score[id] + "\n";
			}
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
	let triviaLocks = config.getConfig("triviaLocks");
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
			} else {
				delete triviaLocks[serverID];
				sendMessage(user, userID, channelID, message, event, "Trivia no longer locked to any channel on this server!").catch(msgErrHandler);
				config.triviaLocks = triviaLocks;
			}
		} else {
			triviaLocks[serverID].push(channelID);
			let out = [];
			for (let lock of triviaLocks[serverID]) {
				out.push("<#" + lock + ">");
			}
			sendMessage(user, userID, channelID, message, event, "Trivia locked to this channel!\nTrivia is locked to the following channels on this server: " + out.join(", ")).catch(msgErrHandler);
			config.triviaLocks = triviaLocks;
		}
	} else {
		triviaLocks[serverID] = [channelID];
		let out = [];
		for (let lock of triviaLocks[serverID]) {
			out.push("<#" + lock + ">");
		}
		sendMessage(user, userID, channelID, message, event, "Trivia locked to this channel!\nTrivia is locked to the following channels on this server: " + out.join(", ")).catch(msgErrHandler);
		config.triviaLocks = triviaLocks;
	}
}

function triviaFix(user, userID, channelID, message, event) {
	if (channelID in gameData) {
		console.log("User: " + user + " force quit trivia in #" + bot.channels[channelID].name + ". Game state:");
		console.dir(gameData[channelID]);
		if (gameData[channelID].TO1) {
			clearTimeout(gameData[channelID].TO1);
		}
		if (gameData[channelID].TO2) {
			clearTimeout(gameData[channelID].TO2);
		}
		if (gameData[channelID].IN) {
			clearInterval(gameData[channelID].IN);
		}
		delete gameData[channelID];
		sendMessage(user, userID, channelID, message, event, "Trivia data cleared!");
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
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	if (serverID && userID === bot.servers[serverID].owner_id)
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
	let out = "";
	Object.keys(bot.servers).forEach(key => {
		out += bot.servers[key].name + "\t" + bot.servers[key].member_count + " members\n";
	});
	if (out.length > 0) {
		let outArr = out.match(/[\s\S]{1,1990}/g); //splits text into 2k character chunks
		for (let msg of outArr) {
			sendMessage(user, userID, userID, message, event, "```\n" + msg + "```").catch(msgErrHandler);
		}
	}
}

function ownerEval(user, userID, channelID, message, event, name) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let input = message.slice((config.getConfig("prefix", serverID) + name + " ").length);
	let out;
	try {
		out = eval(input);
	} catch(e) {
		sendMessage(user, userID, channelID, message, event, e).catch(msgErrHandler);
	}
	if (out) {
		let outStr;
		if (typeof out === "object")
			outStr = "```json\n" + JSON.stringify(out, null, 4) + "```";
		else {
			outStr = out;
		}
		sendMessage(user, userID, channelID, message, event, outStr).catch(msgErrHandler);
	}
}

function setJSON() { //this is a function because it needs to be repeated when it's updated
	let scriptFunctions = config.getConfig("scriptFunctions");
	if (scriptFunctions) {
		let path = "dbs/" + scriptFunctions;
		libFunctions = JSON.parse(fs.readFileSync(path, "utf-8"));
		libFunctions.forEach((func) => {
			if (!func.sig)
				func.sig = "";
		});
	}
	let scriptConstants = config.getConfig("scriptConstants");
	if (scriptConstants) {
		libConstants = JSON.parse(fs.readFileSync("dbs/" + scriptConstants, "utf-8"));
		libConstants.forEach((cons) => {
			if (!cons.val)
				cons.val = "";
			if (typeof cons.val === "number")
				cons.val = cons.val.toString();
		});
	}
	let scriptParams = config.getConfig("scriptParams");
	if (scriptParams) {
		libParams = JSON.parse(fs.readFileSync("dbs/" + scriptParams, "utf-8"));
		libParams.forEach((par) => {
			if (!par.type)
				par.type = "";
		});
	}
	let skillDB = config.getConfig("skillDB");
	if (skillDB) {
		skills = JSON.parse(fs.readFileSync("dbs/" + skillDB, "utf-8"));
		skillNames = [];
		for (let skill of skills) { //populate array of objects containing names for the sake of fuzzy search
			skillNames.push({
				name: skill.name,
			});
		}
		if (skillNames.length > 0) {
			skillFuse = new Fuse(skillNames, config.getConfig("fuseOptions"));
		}
	}
}

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
			let car = new Card(card, [ dbs[lang][0] ]);
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
					let dbList = [ dbs[lang][i] ];
					if (newCard[0] in cards[lang]) { //if already an entry by that ID
						dbList = cards[lang][newCard[0]].db.concat(dbList);
					} 
					let newCar = new Card(newCard, dbList);
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
		fuse[lang] = new Fuse(nameList[lang], config.getConfig("fuseOptions"));
	}
}

async function dbUpdate() {
	return new Promise(resolve => {
		console.log("Starting CDB update!");
		let promises = [];
		dbs = JSON.parse(JSON.stringify(config.getConfig("staticDBs")));
		let oldDbs = {};
		let updateRepos = config.getConfig("updateRepos");
		let liveDBs = config.getConfig("liveDBs");
		for (let lang of Object.keys(updateRepos)) {
			if (liveDBs[lang])
				oldDbs[lang] = JSON.parse(JSON.stringify(liveDBs[lang]));
			liveDBs[lang] = [];
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
						liveDBs[lang] = liveDBs[lang].concat(res);
					});
					promises.push(prom);
				} catch (e) {
					console.error("Failed to download files from " + repo + "!");
					console.error(e);
				}
			}
		}
		Promise.all(promises).then(() => {
			Object.keys(liveDBs).forEach(lang => {
				if (lang in updateRepos) {
					if (dbs[lang]) {
						dbs[lang] = dbs[lang].concat(liveDBs[lang]);
					} else {
						dbs[lang] = liveDBs[lang];
					}
					for (let db of liveDBs[lang]) {
						if (oldDbs[lang])
							oldDbs[lang] = oldDbs[lang].filter(a => a !== db);
					}
					if (config.getConfig("deleteOldDBs") && oldDbs[lang] && oldDbs[lang].length > 0) {
						console.log("Deleting the following old databases in 10 seconds: ");
						console.log(oldDbs[lang]);
						setTimeout(() => {
							for (let db of oldDbs[lang]) {
								console.log("Deleting " + db + ".");
								fs.unlinkSync("dbs/" + lang + "/" + db);
							}
						}, 10000);
					}
				} else {
					delete liveDBs[lang];
				}	
			});
			loadDBs();
			config.liveDBs = liveDBs;
			resolve();
		}).catch(e => console.error(e));
	});
}

function updatejson() {
	return new Promise(resolve => {
		for (let arg of Object.keys(config.sheetsDB)) {
			let sheetID = config.sheetsDB[arg];
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
		let setcodeSource = config.getConfig("setcodeSource");
		console.log("Downloading strings file from " + setcodeSource + "...");
		https.get(url.parse(setcodeSource), response => {
			let data = [];
			response.on("data", chunk => {
				data.push(chunk);
			}).on("end", () => {
				let buffer = Buffer.concat(data);
				let file = buffer.toString();
				console.log("Strings file downloaded. Extracting setcodes and counters...");
				let tempCodes = {};
				let tempCounts = {};
				for (let line of file.split("\r\n")) {
					if (line.startsWith("!setname")) {
						let code = line.split(" ")[1];
						let name = line.slice(line.indexOf(code) + code.length + 1);
						tempCodes[code] = name;
					}
					if (line.startsWith("!counter")) {
						let code = line.split(" ")[1];
						let name = line.slice(line.indexOf(code) + code.length + 1);
						tempCounts[code] = name;
					}
				}
				console.log("Setcodes and counters assembled, writing to file...");
				fs.writeFileSync("config/" + config.getConfig("setcodesDB"), JSON.stringify(tempCodes), "utf-8");
				fs.writeFileSync("config/" + config.getConfig("countersDB"), JSON.stringify(tempCounts), "utf-8");
				setcodes = tempCodes;
				counters = tempCounts;
				Card = require("./card.js")(setcodes);
				console.log("Setcodes and counters updated!");
				resolve();
			});
		});
	});
}

function updateLflist() {
	return new Promise(resolve => {
		let lflistSource = config.getConfig("lflistSource");
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
				fs.writeFileSync("config/" + config.getConfig("lflistDB"), JSON.stringify(tempList), "utf-8");
				lflist = tempList;
				console.log("Banlist updated!");
				resolve();
			});
		});
	});
}

//scripting lib 
function searchFunctions(user, userID, channelID, message, event, name) {
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let arg = message.slice((config.getConfig("prefix", serverID) + name + " ").length);
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
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let arg = message.slice((config.getConfig("prefix", serverID) + name + " ").length);
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
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let arg = message.slice((config.getConfig("prefix", serverID) + name + " ").length);
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
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let arg = parseInt(message.slice((config.getConfig("prefix", serverID) + name).length));
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
	if (config.getConfig("messageMode", serverID) > 0) {
		bot.editMessage({
			channelID: channelID,
			messageID: searchPage[channelID].message,
			embed: {
				color: config.getConfig("embedColour", serverID),
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
	let serverID = bot.channels[channelID] && bot.channels[channelID].guild_id;
	let arg = parseInt(message.slice((config.getConfig("prefix", serverID) + name).length));
	if (!searchPage[channelID] || userID !== searchPage[channelID].user || isNaN(arg) || arg > searchPage[channelID].pages[searchPage[channelID].index].length) {
		return;
	}
	let index = arg - 1;
	if (!searchPage[channelID].pages[searchPage[channelID].index][index]) {
		return;
	}
	let desc = searchPage[channelID].pages[searchPage[channelID].index][index].desc;
	if (!desc || desc.trim().length === 0) {
		desc = "No description found for this entry.";
	}
	if (config.getConfig("messageMode", serverID) > 0) {
		bot.editMessage({
			channelID: channelID,
			messageID: searchPage[channelID].message,
			embed: {
				color: config.getConfig("embedColour", serverID),
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
