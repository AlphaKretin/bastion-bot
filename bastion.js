let fs = require('fs');

let config = JSON.parse(fs.readFileSync('config/config.json', 'utf8')); //open config file from local directory. Expected contents are as follows
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
let randFilterAttempts = 1000;
if (config.randFilterAttempts) {
	randFilterAttempts = config.randFilterAttempts;
} else {
	console.log("No upper limit on randcard re-rolls found at config.randFilterAttempts! Defaulting to " + randFilterAttempts + "!");
}
let maxSearches = 3;
if (config.maxSearches) {
	maxSearches = config.maxSearches;
} else {
	console.log("No upper limit on searches in one message found at config.maxSearches! Defaulting to " + maxSearches + "!")
}
let dbs = ["cards.cdb"];
if (config.dbs) {
	dbs = config.dbs;
} else {
	console.log("List of card databases not found at config.dbs! Defaulting to one database named " + dbs[0] + ".");
}
/*
	{
	"token": "", //Discord bot token for log-in
	"prefix" "!", //character at the start of commands
	"longStr": "", //The string to be appended to the end of a too-long message, telling the user to type ".long"
	"randFilterAttempts": 1000, //the number of tries to find a random card meeting criteria before bastion gives up. Infinite loop without this!
	"maxSearches": 3, //the number of searches a user is allowed per post
	"imageUrl": "", //this will be the start of the URL from which official card images are downloaded. Bastion will appened the card ID, and then .png.
	"imageUrlAnime": "", //this will be the start of the URL from which anime card images are downloaded. Bastion will appened the card ID, and then .png.
	"imageUrlCustom": "", //this will be the start of the URL from which custom card images are downloaded. Bastion will appened the card ID, and then .png.
	"scriptUrl": "",
	"scriptUrlAnime": "",
	"scriptUrlCustom": "",
	"imageSize": 100, //the height and width for card images to be resized to, in px.
	"dbs" [ "", "" ] //a list of databases to read cards from, in a folder in the local directory called "dbs"
}
*/
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
let SQL = require('sql.js');
let filebuffer = fs.readFileSync("dbs/" + dbs[0]);
let db = new SQL.Database(filebuffer);
let contents = db.exec("SELECT * FROM datas");
let names = db.exec("SELECT * FROM texts");
if (dbs.length > 1) {
	for (let i = 1; i < dbs.length; i++) {
		let newbuffer = fs.readFileSync("dbs/" + dbs[i]);
		let newDB = new SQL.Database(newbuffer);
		let newContents = newDB.exec("SELECT * FROM datas");
		let newNames = newDB.exec("SELECT * FROM texts");
		for (let card of newContents[0].values) {
			contents[0].values.push(card);
		}
		for (let card of newNames[0].values) {
			names[0].values.push(card);
		}
	}
}
let ids = [];
let aliases = [];
let nameList = [];
for (let card of contents[0].values) { //populate ID list for easy checking of card validity
	ids.push(card[0]);
	aliases.push(card[2]);
}
for (let card of names[0].values) { //populatre array of objects containing names for the sake of fuse
	nameList.push({
		name: card[1],
		id: card[0]
	});
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
let fuse = new Fuse(nameList, options);

let request = require('request');
let https = require('https');
let url = require('url');
let jimp = require('jimp');

let longMsg = "";
let gameData = {};


//real shit
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
	if (imagesEnabled && checkForPermissions(userID, channelID, [8192]) && lowMessage.indexOf(pre + "tlock") === 0) {
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
	if (message.indexOf("<@" + bot.id + ">") > -1) {
		help(user, userID, channelID, message, event);
	}
	if (longMsg.length > 0 && lowMessage.indexOf(".long") === 0) {
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
	let re = /{([^:@]*?)}/g;
	let results = [];
	let regx;
	do {
		regx = re.exec(message);
		if (regx !== null) {
			results.push(regx[1]);
		}
	} while (regx !== null);
	let results2 = [];
	if (imagesEnabled) {
		let re2 = /<([^:@]*?)>/g;
		let regx2;
		do {
			regx2 = re2.exec(message);
			if (regx2 !== null) {
				results2.push(regx2[1]);
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
		do {
			i++;
			code = ids[Math.floor(Math.random() * ids.length)];
			if (ids.indexOf(code) === -1) {
				console.log("Invalid card ID, please try again.");
				return "Invalid card ID, please try again.";
			}
		} while (!randFilterCheck(code, args) && i < randFilterAttempts);
		if (i >= randFilterAttempts) {
			bot.sendMessage({
				to: channelID,
				message: "No card matching your critera was found after " + randFilterAttempts + " attempts, so one probably doesn't exist."
			});
			return
		}
		let out = await getCardInfo(code, user, userID, channelID, message, event);
		if (imagesEnabled && args.indexOf("image") > -1) {
			postImage(out[1], out[0], user, userID, channelID, message, event);
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
	let index = ids.indexOf(inInt)
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
			let index = nameCheck(input);
			if (index > -1 && index in ids) {
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
	let inInt = parseInt(input);
	if (ids.indexOf(inInt) > -1) {
		try {
			let out = await getCardInfo(inInt, user, userID, channelID, message, event);
			if (hasImage) {
				postImage(out[1], out[0], user, userID, channelID, message, event);
			} else {
				sendLongMessage(out[0], user, userID, channelID, message, event);
			}

		} catch (e) {
			console.log("Error with search by ID:");
			console.log(e);
		}
	} else {
		try {
			let index = nameCheck(input);
			if (index > -1 && index in ids) {
				let out = await getCardInfo(ids[index], user, userID, channelID, message, event);
				if (hasImage) {
					postImage(out[1], out[0], user, userID, channelID, message, event);
				} else {
					sendLongMessage(out[0], user, userID, channelID, message, event);
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

function getCardInfo(code, user, userID, channelID, message, event) {
	let index = ids.indexOf(code);
	if (index === -1) {
		console.log("Invalid card ID, please try again.");
		return "Invalid card ID, please try again.";
	}
	let card = contents[0].values[index];
	let name = names[0].values[index];
	return new Promise(function(resolve, reject) {
		let out = "__**" + name[1] + "**__\n";
		let alIDs = [code];
		if (aliases[ids.indexOf(code)] > 0) {
			if (getOT(ids.indexOf(code)) === getOT(ids.indexOf(aliases[ids.indexOf(code)]))) {
				code = aliases[ids.indexOf(code)];
				alIDs = [code];
				for (let i = 0; i < aliases.length; i++) {
					if (aliases[i] === code && getOT(i) === getOT(ids.indexOf(code))) {
						alIDs.push(ids[i]);
					}
				}
			}
		} else if (aliases.indexOf(code) > 0) {
			for (let i = 0; i < aliases.length; i++) {
				if (aliases[i] === code && getOT(i) === getOT(ids.indexOf(code))) {
					alIDs.push(ids[i]);
				}
			}
		}
		out += "**ID**: " + alIDs.toString().replace(/,/g, "|") + "\n";
		let sets = setCodeCheck(index, user, userID, channelID, message, event);
		if (sets) {
			out += "**Archetype**: " + sets.toString().replace(/,/g, ", ") + "\n";
		} else {
			out += "\n";
		}
		request('https://yugiohprices.com/api/get_card_prices/' + name[1], function(error, response, body) {
			let data = JSON.parse(body);
			if (data.status === "success") {
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
				out += "**Status**: " + getOT(index) + " **Price**: $" + low.toFixed(2) + "-$" + avg.toFixed(2) + "-$" + hi.toFixed(2) + " USD\n";
			} else {
				out += "**Status**: " + getOT(index) + "\n";
			}
			let types = getTypes(index);
			if (types.indexOf("Monster") > -1) {
				let typesStr = types.toString().replace("Monster", getRace(index)).replace(/,/g, "/");
				out += "**Type**: " + typesStr + " **Attribute**: " + getAtt(index) + "\n";
				let lvName = "Level";
				let lv = getLevelScales(index);
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
					out += "**Link Markers**: " + getMarkers(index);
				}
				if (types.indexOf("Pendulum") > -1) {
					out += " **Pendulum Scale**: " + lv[1] + "/" + lv[2] + "\n";
				} else {
					out += "\n";
				}
				let cardText = getCardText(index);
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
				let lv = getLevelScales(index)[0];
				if (lv > 0) { //is trap monster
					let typesStr = getRace(index) + "/" + types.toString().replace(/,/g, "/");
					out += "**Type**: " + typesStr + " **Attribute**: " + getAtt(index) + "\n";
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

async function postImage(code, out, user, userID, channelID, message, event) {
	try {
		let imageUrl = imageUrlMaster;
		if (["Anime", "Illegal", "Video Game"].indexOf(getOT(ids.indexOf(code[0]))) > -1) {
			imageUrl = imageUrlAnime;
		}
		if (getOT(ids.indexOf(code[0])) === "Custom") {
			imageUrl = imageUrlCustom;
		}
		if (code.length > 1) {
			let pics = [];
			for (let cod of code) {
				let buffer = await downloadImage(imageUrl + cod + ".png", (getTypes(ids.indexOf(cod)).indexOf("Pendulum") > -1), user, userID, channelID, message, event);
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
			for (let i = 1; i < pics.length; i++) {
				await new Promise(function(resolve, reject) {
					new jimp(imageSize * (i + 1), imageSize, function(err, image) {
						if (err) {
							reject(err);
						} else {
							image.composite(pics[0], 0, 0);
							image.composite(pics[i], pics[0].bitmap.width, 0);
							pics[0] = image;
							resolve(image);
						}
					});
				});
			}
			let buffer = await new Promise(function(resolve, reject) {
				pics[0].getBuffer(jimp.AUTO, function(err, res) {
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
			let buffer = await downloadImage(imageUrl + code[0] + ".png", (getTypes(ids.indexOf(code[0])).indexOf("Pendulum") > -1), user, userID, channelID, message, event);
			bot.uploadFile({
				to: channelID,
				file: buffer,
				filename: code[0] + ".png"
			}, function(err, res) {
				sendLongMessage(out, user, userID, channelID, message, event);
			});
		}
	} catch (e) {
		console.log(e);
	}

}

function downloadImage(imageUrl, pendulum, user, userID, channelID, message, event) {
	return new Promise(function(resolve, reject) {
		https.get(url.parse(imageUrl), function(response) {
			let data = [];
			response.on('data', function(chunk) {
				data.push(chunk);
			}).on('end', function() {
				let buffer = Buffer.concat(data);
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
			});
		});
	});

}

function getCardScript(index, user, userID, channelID, message, event) {
	return new Promise(function(resolve, reject) {
		let scriptUrl = scriptUrlMaster;
		if (["Anime", "Illegal", "Video Game"].indexOf(getOT(index)) > -1) {
			scriptUrl = scriptUrlAnime;
		}
		if (getOT(index) === "Custom") {
			scriptUrl = scriptUrlCustom;
		}
		let fullUrl = scriptUrl + "c" + ids[index] + ".lua";
		https.get(url.parse(fullUrl), function(response) {
			let data = [];
			response.on('data', function(chunk) {
				data.push(chunk);
			}).on('end', async function() {
				let buffer = Buffer.concat(data);
				let script = buffer.toString();
				if (script === "404: Not Found\n" && scriptBackupEnabled) {
					script = await new Promise(function(resolve, reject) {
						fullUrl = scriptUrlBackup + "c" + ids[index] + ".lua";
						https.get(url.parse(fullUrl), function(response) {
							let data2 = [];
							response.on('data', function(chunk) {
								data2.push(chunk);
							}).on('end', async function() {
								let buffer2 = Buffer.concat(data2);
								let script2 = buffer2.toString();
								resolve(script2)
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
	let results = fuse.search(arg);
	if (results.length < 1) {
		bot.sendMessage({
			to: channelID,
			message: "No matches found!"
		});
	} else {
		let out = "Top 10 card name matches for `" + arg + "`:";
		let i = 0;
		let outs = [];
		let ot = getOT(ids.indexOf(results[0].item.id));
		while (results[i] && outs.length < 10) {
			let index = ids.indexOf(results[i].item.id)
			if (ot === getOT(index) && aliasCheck(index)) {
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

function nameCheck(line) {
	for (let i = 0; i < names[0].values.length; i++) { //check all entries for exact name
		if (names[0].values[i][1].toLowerCase() === line.toLowerCase()) {
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
		for (let i = 0; i < names[0].values.length; i++) { //check all entries for exact name
			if (names[0].values[i][1].toLowerCase() === newLine.toLowerCase()) {
				return i;
			}
		}
		let result = fuse.search(newLine);
		if (result.length < 1) {
			return -1;
		} else {
			let index = -1;
			for (let i = 0; i < names[0].values.length; i++) {
				if (names[0].values[i][1].toLowerCase() === result[0].item.name.toLowerCase()) {
					index = i;
				}
			}
			return index;
		}
	} else {
		let result = fuse.search(line);
		if (result.length < 1) {
			return -1;
		} else {
			let index = -1;
			for (let i = 0; i < names[0].values.length; i++) {
				if (names[0].values[i][1].toLowerCase() === result[0].item.name.toLowerCase()) {
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

function getLevelScales(index) {
	let level = contents[0].values[index][7];
	return [level & 0xff, (level & 0xf000000) >> 24, (level & 0xf0000) >> 16];
}

function getOT(index) {
	let ot = contents[0].values[index][1];
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

function getRace(index) {
	let race = contents[0].values[index][8];
	switch (race) {
		case 0x1:
			return "Warrior";
		case 0x2:
			return "Spellcaster";
		case 0x4:
			return "Fairy";
		case 0x8:
			return "Fiend";
		case 0x10:
			return "Zombie";
		case 0x20:
			return "Machine";
		case 0x40:
			return "Aqua";
		case 0x80:
			return "Pyro";
		case 0x100:
			return "Rock";
		case 0x200:
			return "Winged Beast";
		case 0x400:
			return "Plant";
		case 0x800:
			return "Insect";
		case 0x1000:
			return "Thunder";
		case 0x2000:
			return "Dragon";
		case 0x4000:
			return "Beast";
		case 0x8000:
			return "Beast-Warrior";
		case 0x10000:
			return "Dinosaur";
		case 0x20000:
			return "Fish";
		case 0x40000:
			return "Sea Serpent";
		case 0x80000:
			return "Reptile";
		case 0x100000:
			return "Psychic";
		case 0x200000:
			return "Divine-Beast";
		case 0x400000:
			return "Creator God";
		case 0x800000:
			return "Wyrm";
		case 0x1000000:
			return "Cyberse";
		case 0x80000000:
			return "Yokai";
		case 0x100000000:
			return "Charisma";
		default:
			return "Null Race";
	}
}

function getAtt(index) {
	let att = contents[0].values[index][9];
	switch (att) {
		case 0x1:
			return "EARTH";
		case 0x2:
			return "WATER";
		case 0x4:
			return "FIRE";
		case 0x8:
			return "WIND";
		case 0x10:
			return "LIGHT";
		case 0x20:
			return "DARK";
		case 0x40:
			return "DIVINE";
		case 0x80:
			return "LAUGH";
		default:
			return "Null Attribute";
	}
}

function getMarkers(index) {
	let marks = contents[0].values[index][6];
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

function getTypes(index) {
	let types = [];
	let type = contents[0].values[index][4];
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

function getCardText(index) {
	let cardText = names[0].values[index][2];
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

function randFilterCheck(code, args) {
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
		let index = ids.indexOf(code);
		let boo = true;
		if (otFilters.length > 0 && otFilters.indexOf(getOT(index).toLowerCase()) === -1) {
			boo = false;
		}
		if (typeFilters.length > 0) {
			let subBoo = false;
			for (let type of getTypes(index)) {
				if (typeFilters.indexOf(type.toLowerCase()) > -1) {
					subBoo = true;
				}
			}
			boo = subBoo;
		}
		if (raceFilters.length > 0 && raceFilters.indexOf(getRace(index).toLowerCase()) === -1) {
			boo = false;
		}
		if (attFilters.length > 0 && attFilters.indexOf(getAtt(index).toLowerCase()) === -1) {
			boo = false;
		}
		if (lvFilters.length > 0 && lvFilters.indexOf(getLevelScales(index)[0].toString()) === -1) {
			boo = false;
		}
		return boo;
	}
}

function setCodeCheck(index, user, userID, channelID, message, event) {
	if (aliases[index] > 0) {
		index = ids.indexOf(aliases[index]);
	}
	let code = contents[0].values[index][3].toString("16");
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

function aliasCheck(index) {
	let alias = aliases[index];
	if (alias === 0) {
		return true;
	}
	let alIndex = ids.indexOf(alias);
	return getOT(index) !== getOT(alIndex);
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
		startTriviaRound(ot, round, hard, user, userID, channelID, message, event);
	}
}

async function startTriviaRound(ot, round, hard, user, userID, channelID, message, event) {
	//pick a random card
	let index;
	let code;
	do {
		index = Math.floor(Math.random() * ids.length);
		code = ids[index];
	} while (ot.indexOf(getOT(index)) === -1);
	let name = names[0].values[index][1];
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
			"hard": hard
		}
	}
	let imageUrl = imageUrlMaster;
	if (["Anime", "Illegal", "Video Game"].indexOf(getOT(ids.indexOf(code))) > -1) {
		imageUrl = imageUrlAnime;
	}
	if (getOT(ids.indexOf(code)) === "Custom") {
		imageUrl = imageUrlCustom;
	}
	https.get(url.parse(imageUrl + code + ".png"), function(response) {
		let data = [];
		response.on('data', function(chunk) {
			data.push(chunk);
		}).on('end', async function() {
			let buffer = Buffer.concat(data);
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
							startTriviaRound(gameData[channelID].ot, (gameData[channelID].round - 1), gameData[channelID].hard, user, userID, channelID, message, event);
						}, triviaTimeLimit);
					}
				}
			});
		});
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
			startTriviaRound(gameData[channelID].ot, (gameData[channelID].round - 1), gameData[channelID].hard, user, userID, channelID, message, event);
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