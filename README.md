# Bastion  
Bastion is a [Discord](https://discordapp.com/) bot written in the NodeJS module [discord.io](https://github.com/izy521/discord.io), with a focus on functions related to the Yu-Gi-Oh! card game and a simulator of it, [YGOPro Percy](http://ygopro.co). The name comes from [an intellectual character](http://yugioh.wikia.com/wiki/Bastion_Misawa) in the related anime. All commands are case-insensitive.  
  
You can install a copy of Bastion yourself, more information on how below, but if you'd rather just use my copy, [here's](https://discordapp.com/oauth2/authorize?client_id=383854640694820865&scope=bot&permissions=3072) the invite link. For support and feedback, my Discord server is [here](https://discordapp.com/invite/GrMGspZ), and you can support me on Patreon [here]( https://www.patreon.com/alphakretinbots).  
  
## Credits

### Patrons  
Thank you very much to my 10 and 20 dollar Patreon backers:  
 - Nemo "冴月麟" Ma  
  
### Contributors
Thank you to the following users for their work on Bastion:
 - MichaelLawrenceDee: For features including emotes and output display modes.  
 - edo9300: For features including multiple languages and improving database loading.  
 - Gideon: For hosting the public copy of the bot.  
 - Becasita: For pointing out the Yugipedia API.
 
## Commands  
Bastion's primary purpose is a database of card information. Basic knowledge about relevant terms will be assumed in this section and the next. Note that Bastion's prefix is customisable - more information on that in the configuration section - this section assumes the default prefix of ".".  
  
A few general notes on card searching: My copy of Bastion references a card database with official cards, including recently revealed unreleased cards, anime cards from YGOPro Percy, and custom cards from the [G2 YGO Custom Server](https://discordapp.com/invite/Vv5NnCq). Bastion will search for the nearest guess if you don't type an exact name. Bastion has a system for hardcoded shortcuts - if you type a common abbreviation for a card name, it will try to convert it to the full name. Price data comes from the [http://yugiohprices.com](http://yugiohprices.com) API. "Status" is a term I use for what YGOPro developers call "OT" - a designation that reflects whether a card is legal in the OCG, TCG, both, or other options for unofficial cards like Anime, Illegal and Custom.  
  
### Help  
Usage: `@Bastion#3599|.help`  
  
Mentioning Bastion or typing `.help` will provide a link to this readme.  
  
### Card Lookup  
Usage: `{card name/ID[,lang,lang]}`  
  
This command searches for a card by the name or YGOPro ID specified in the brackets and returns the card's name, all of its IDs in YGOPro, any archetypes its a member of, its status, its lowest, average, and highest prices if available, its types, its attribute if it's a monster, any stats, and its card text. If you enter two valid language codes (e.g. "en", "ja", "es"), Bastion will search by the first language and output in the second.  
  
As an example, `{dark magician}` returns the following output:  
![card output](/readme-images/card.png)  
  
### Card With Image  
Usage: `<card name/ID[,lang,lang]>`  
  
This command works the same way as the above command, but also displays an image of the card's artwork.  
  
As an example, `<stardust dragon>` returns the following output:  
![card image output](/readme-images/card-image.png)  
  
### Individual Property Lookup  
Usage: `.id [card name/ID]`, `.notext [card name/ID]`, `.effect [card name/ID]`  
  
Using these commands, you can search like the above two, but it will return only the card IDs, just the stats etc. without card text, or only card text respectively. None of these options display the image.  
  
### .randcard  
Usage: `.randcard [opts]`  
  
The `.randcard` command will select a random card and display its information as if you searched it. The command accepts the following options, with a value after the prefix (with no space):  
 - `status:` or `ot:` allow you to specify the status of the card.  
 - `type:` allows you to specify the card type - as in "Monster", "Spell", "Xyz" or "Field".  
 - `race:` or `mtype:` specifies the monster type of the card - as in "Spellcaster" or "Dragon".  
 - `attribute:` or `att:` specifies the attribute.  
 - `set:` or `archetype:` specifies the archetype.  
 - `level:` specifies the level.  
 - `lscale:` and `rscale:` specify the left and right Pendulum scale alone, or `scale:` specifies either.  
 - `atk:` and `def:` specify the ATK and DEF stats.  
For any of these options, you can specify multiple paramaters and tell Bastion if it needs all or one of them using "/" and "+". Rather than try in vain to explain, I'll use an example.  
`.randcard type:spell+ritual/effect+monster` will return a card that is either both a spell and a ritual or an effect and a monster.  
In addition, you can type `image` or a language, with no prefix, to make it display the image and specify the language it'll return.  
  
As an example, `.randcard ot:tcg/ocg level:4 image` returns the following output:  
![.randcard output](/readme-images/randcard.png)  
  
### .script  
Usage: `.script [name/id]|[lang]`  
  
The `.script` command searches for a card by name or YGOPro ID and returns a link to its script for YGOPro, as well as embedding it if short enough. If a language is specified, it will look for a card with a name like you typed in that language.  
  
As an example, `.script macro cosmos` returns the following output:  
![.script output](/readme-images/script1.png)  
![.script output 2](/readme-images/script2.png)  
  
### .matches  
Usage: `.matches [name]|[args]`  
  
The `.matches` command simulates a search for cards by name and returns the 10 closest matches for your search term. If you specify arguments after a `|`, (the same kinds as `.randcard`), it will only show matches that fit that critera. This command ignores cards with the same name, for example alternate artworks, however it will allow Anime versions of existing cards, etc., unless you specify a status as an arg.  
  
As an example, `.matches junk warrior` returns the following output:  
![.matches output](/readme-images/matches.png)  
  
### .set  
Usage: `.set [name|setcode]`  
  
The `.set` command searches for an archetype, or "setcode" by either its name or its hexadecimal value in YGOPro (`0xba` for example) and returns both.  
  
As an example, `.set 0xba` returns the following output:  
![.set output](/readme-images/set.png)  
  
### .deck  
Usage: `.deck [language]` and upload file  
  
The `.deck` command reads the contents of a YGOPro `.ydk` file uploaded with the message, and sends a direct message to the user listing the contents of the deck in the specified language (English by default).  
  
### .strings  
Usage: `.strings [card name/ID]|[lang]`  
  
The `.strings` command searches for a card by name or YGOPro ID, and returns the database strings for that card - i.e., the customs messages assigned to it that a script can call on for effect descriptions or dialog boxes. If a language is specified, it will look for a card with a name like you typed in that language.  
  
### .skill  
Usage: `.skill [skill name]`  
  
The `.skill` command searches for a Skill, from Yu-Gi-Oh! Duel Links, and returns its name, description, and a list of which characters can obtain the Skill and how.  
  
### .top  
Usage: `.top [number] [stat] [lang]`  
  
The `.top` command looks up the rankings for a given statistic, and returns the most common, up to the given amount. The available options are:  
`cards`, which will look up the most commonly searched cards.  
`inputs`, which will look up the most commonly entered search terms when searching for cards.  
`commands`, which will look up the most commonly used commands of the bot.  
If not all the parameters are specified, it will default to the top 10 cards in English. If a language is specified, it will look for a card with a name like you typed in that language.  
  
### Scripting Library  
Usage: `.f [function name]`, `.c [constant name]`, `.param [parameter name]`  
  
Bastion can return information about YGOPro's Lua API with the above commands. All results that match your query will be displayed, in pages of 9. Type or edit `.p[page number]` to change pages. Entries will be displayed with a corresponding number - type or edit `.d[number]` to see a more detailed description of that entry, if available.  
  
### .skill  
Usage: `.skill [name]`  
  
The `.skill` command searches for a character skill from Yu-Gi-Oh! Duel Links by name, and returns its name, the description of what it does, and which characters can obtain it and how.  
  
### .trivia  
Usage: `.trivia [options]`  
For fun, Bastion can play a game where it will provide the art of a card, and players have 30 seconds to give its name, with a hint at 10 seconds. The command accepts any number of the following options:  
**Options**: These are the same options as `.randcard`.
**Rounds**: If you include a number as an option (without a prefix), the game will run that many times and track the total scores of each player over the course of the game.  
**Hard Mode**: If you include `hard` as an option, Bastion will display only a quarter of the card image, for added difficulty.  
**Language**: If you include a language code as an option, Bastion will use that language for the card name.  
You can end the game prematurely by typing ".tq", or pass a round by typing ".tskip".  
  
### .tlock  
Usage: `.tlock`  
The `.tlock` command tells Bastion that on the server you use the command, he should only allow `.trivia` in the channels in which you've used the command. Only users with the "Manage Messages" permission can use the command. You can use the command in multiple channels to allow trivia in multiple channels. Using the command in a channel already registered will remove it from the list. If there are no channels in the list, trivia will be allowed anywhere.  
  
## Installation  
If you so choose, you can run a copy of Bastion yourself! This section will assume some basic familiarity with NodeJS and the command line.  
  
All of Bastion's dependencies are properly documented in the package.json, so you can just download that, put it in a folder, and run `npm install`. If `npm install` fails, you might need to install [Git](https://git-scm.com/) before trying again (having GitHub Desktop isn't enough). To run the bot, the script expects some certain files - a configuration file, a banlist file, a shortcuts file, a setcodes file, an emotes file, a skills file, a stats file, any number of SQLite databases containing card data, in the format YGOPro uses, and optionally 3 files with information about YGOPro's API with a customizable name. Once it's setup, you can use `node bastion.js` to run it once, or on Windows, use `autorun.bat` to have it automatically restart upon a crash.  
  
### Configuration  
By default, the configuration file is called `config.json`, and is expected to be found in a subfolder of the local directory called `config`, i.e. `config/config.json`. The script expects `config.json` to contain a JSON object with the following properties:  
```json  
{  
	"token": "",  
	"prefix": ".",  
	"longStr": "...\n__Type \".long\" to be PMed the rest!__",  
	"maxSearches": 3,  
	"imageUrl": "",  
	"imageUrlAnime": "",  
	"imageUrlCustom": "",  
	"imageSize": 100,  
	"imageExt": "png",  
	"scriptUrl": "",  
	"scriptUrlAnime": "",  
	"scriptUrlCustom": "",  
	"staticDBs": {  
		"en": [ "cards.cdb" ]  
	},  
	"dbMemory": 33554432,  
	"triviaTimeLimit": 30000,  
	"triviaHintTime": 10000,  
	"triviaMaxRounds": 20,  
	"triviaLocks": {},  
	"botOwner": ["169299769695535105"],  
	"scriptFunctions": "functions.json",  
	"scriptConstants": "constants.json",  
	"scriptParams": "parameters.json",  
	"skillDB": "skills.json",  
	"emoteMode": 0,  
	"emotesDB": null,  
	"helpMessage": "I am a Yu-Gi-Oh! card bot made by AlphaKretin#7990.\nPrice data is from the <https://yugiohprices.com> API.\nYou can find my help file and source here: <https://github.com/AlphaKretin/bastion-bot/>\nYou can support my development on Patreon here: <https://www.patreon.com/alphakretinbots>\nType `.commands` to be DMed a short summary of my commands without going to an external website.",  
	"messageMode": 0,  
	"embedColor": 1,  
	"embedColorDB": null,  
	"debugOutput": false,  
	"sheetsDB": "sheets.json",  
	"defaultLanguage": "en",  
	"shortcutsDB": "shortcuts.json",  
	"setcodesDB": "setcodes.json",  
	"lflistDB": "lflist.json",  
	"statsDB": "stats.json",  
	"updateRepos": {  
        "en": []  
    },  
    "liveDBs": {  
        "en": []  
    }  
    "deleteOldDBs": false  
}  
```  
`token` is the Discord User token that the discord.io module will use to log in to Discord. You can obtain a bot token through the [Discord Developers website](https://discordapp.com/developers/applications/me/). This field is required.  
  
`prefix` is the text that Bastion will look for at the start of messages to indicate that it's a bot command. For example, if `prefix` is "b$", `.randcard` becomes `b$randcard`. This field is optional - if it is missing, Bastion will default to what you see above.  
  
`longStr` is the message Bastion will append to an output that's split up due to violating Discord's character limit, instructing the user how to see the rest. This field is optional - if it is missing, Bastion will default to what you see above.  
  
`maxSearches` is the number of different cards Bastion will allow a user to search at once - if a message contains more queries, Bastion won't search anything, instead returning an error message. This field is optional - if it is missing, Bastion will default to what you see above.  
  
`imageUrl` is a link to a source for card images - either official ones, or all of them. Bastion will append the ID of the card, then ".", then `imageExt`. This field is optional - if it is missing, functions that require images will be disabled and the following fields will be ignored: `imageUrlAnime`, `imageUrlCustom`, `imageSize`, `triviaTimeLimit`, `triviaHintTime`, `triviaMaxRounds` and `triviaLocks`.  
  
`imageUrlAnime` is a link to a source for anime card images. Bastion will append the ID of the card, hen ".", then `imageExt`. This field is optional - if it is missing, Bastion will default to `imageUrl`.  
  
`imageUrlCustom` is a link to a source for custom card images. Bastion will append the ID of the card, hen ".", then `imageExt`. This field is optional - if it is missing, Bastion will default to `imageUrl`.  
  
`imageExt` is the file type Bastion will expect your image source to contain, as a file extension starting with the `.`. This field is optional - if it is missing, Bastion will default to what you see above.  
  
`scriptUrl` is a link to a source for card scripts - either official ones, or all of them. Bastion will append the ID of the card, then ".lua". This field is optional - if it is missing, functions that require scripts will be disabled and the following fields will be ignored: `scriptUrlAnime`, and `scriptUrlCustom`.  
  
`scriptUrlAnime` is a link to a source for anime card scripts. Bastion will append the ID of the card, then ".lua". This field is optional - if it is missing, Bastion will default to `scriptUrl`.  
  
`scriptUrlCustom` is a link to a source for custom card scripts. Bastion will append the ID of the card, then ".lua". This field is optional - if it is missing, Bastion will default to `scriptUrl`.  
  
`scriptUrlBackup` is a link to a source for backup card scripts - if Bastion doesn't find a script at the first source specified, he'll try again here. Bastion will append the ID of the card, then ".lua". This field is optional - if it is missing, Bastion will not try to find backup scripts.  
  
`staticDBs` is an object of arrays of filenames for card databases Bastion will read, to be found in a folder called `dbs`. The keys of the object are language names. If two DBs have an entry with the same ID, for example because of "fix" DBs, the latest occurence in the array will be the final version of the entry that overwrites the others. This object is for base databases that should not be modified by the live update process - if you have anything stored in a GitHub repository, see below for fields that enable an automatic update process. This field is optional - if it is missing, Bastion will default to what you see above.  
  
`dbMemory` is the size allocated in memory for Bastion to load card database, in bytes. If you get the error "Cannot adjust memory arrays" in the middle of loading databases, you need to increase this. This field is optional - if it is missing, Bastion will default to what you see above.  
  
`triviaTimeLimit` is the time a player has to guess the answer in the trivia game, in milliseconds. This field is optional - if it is missing, Bastion will default to what you see above.  
  
`triviaHintTime` is the time at which Bastion will provide a hint for the player in the trivia game, in milliseconds. If it is greater than `triviaTimeLimit`, the hint will never display, which may be behaviour you desire. This field is optional - if it is missing, Bastion will default to what you see above.  
  
`triviaMaxRounds` is the maximum number of rounds a player can set the trivia game to run for, to prevent someone from forcing it to run for an arbitrarily long time. This field is optional - if it is missing, Bastion will default to what you see above.  
  
`triviaLocks` is an object with server IDs as keys and an array of channel IDs as the properties. If a server is in the object, the trivia game can only be player in the channels listed in the array. This field is optional - if it is missing, Bastion will default to what you see above, and you can configure it through Bastion even if you don't run the copy using the `.tlock` command.  
  
`botOwner` is an array of Discord user IDs of the users you consider to own the bot, likely including yourself, for the sake of administrative functions. This field is optional - if it is missing, such functions will be disabled.  
  
`scriptFunctions` is the name of the JSON file Bastion will load containing information about the YGOPro API's functions - details on this file below. This field is optional - if it is missing, searching for functions will be disabled.  
  
`scriptConstants` is the name of the JSON file Bastion will load containing information about the YGOPro API's constants - details on this file below. This field is optional - if it is missing, searching for constants will be disabled.  
  
`scriptParams` is the name of the JSON file Bastion will load containing information about the YGOPro API's parameters - details on this file below. This field is optional - if it is missing, searching for parameters will be disabled.  
  
`skillDB` is the name of the JSON file Bastion will load containing information about skills in Duel Links - details on this file below. This field is optional - if it is missing, searching for skills will be disabled.  
  
`emoteMode` determines if and how emotes will be used when displaying card data. If it is set to 0, emotes will not be used and Types, Attributes etc. will be displayed with text. If it is set to 1, emotes will be used exclusively, representing such properties with only icons. If it is set to 2, it will display both text and icons. This field is optional - if it is missing, it will default to what you see above.  
  
`emotesDB` is the name of the JSON file Bastion will load containing the emotes it will use for its card searches and/or reacting to trivia. This won't be loaded if emoteMode is set to 0. This field is optional - is can be ignored depending on `emoteMode`'s setting, and if it is expected but missing, displaying emotes will be disabled.  
  
`helpMessage` is the message the bot will respond with when mentioned or the .help command is used, ideally providing a link to this readme and/or explaning the commands.  
  
`messageMode` determines how Bastion will send Messages. If it is set to 0, it will send messages in regular text format. If it is set to 1, it will send messages enclosed in quotes. If it is set to 2, it will send embedded messages. If it is set to 3, it will send messages enclosed in quotes which are also embedded. This field is optional - if it is missing, it will default to what you see above.  
  
`embedColor` is the default color of the bar of your embedded messages. This field is optional - is can be ignored depending on `messageMode`'s setting, and if it is expected but missing, the default color will be used. This is a decimal value converted from a hex color value.  
  
`embedColorDB` is the name of the JSON file Bastion will load containing the color codes of your embedded messages. Currently, it only supports different colors depending on the card type of a searched card. This field is optional - if it is missing, all embedded messages will have the same color.  
  
`debugOutput` is a boolean that determines if Bastion will log large amounts of data to the console, in situations that have caused unexplained crashes before. However, such a crash has not occured since I added such logs, and it is a large amount of logging, so it is recommended to disable this. This field is optional - if it is missing, it will default to what you see above.  
  
`sheetsDB` is the name of the JSON file Bastion will load containing the Google Spreadsheet IDs that will be loaded to update your JSONs. This field is optional - if it is missing, the corresponding command will be disabled.  
  
`defaultLanguage` should be a key from `dbs` that you consider to represent the "main" language you'll be using with Bastion, to be defaulted to when a language is not specified. This field is optional - if it is missing, it will default to what you see above.  
  
`rulingLanguage` should be a key from `dbs` that represents Japanese, for use with looking up rulings on the official OCG database. This field is optional - if it is missing, the corresponding command will be disabled.  
  
`shortcutsDB` is the name of the JSON file containing shortcut data, as detailed below. This field is optional - if it is missing, it will default to what you see above.  
  
`setcodesDB` is the name of the JSON file containing archetype data, as detailed below. This field is optional - if it is missing, it will default to what you see above.  
  
`lflistDB` is the name of the JSON file containing banlist data, as detailed below. This field is optional - if it is missing, it will default to what you see above.  
  
`statsDB` is the name of the JSON file that will store stat data. This field is optional - if it is missing, it will default to what you see above.  
  
`updateRepos` is an object with languages as keys, like `staticDBs`, but the values are arrays of names of GitHub repositories, in the format `Username/Repo`. These should be repositories that contain card databases in the given language (though they can contain other files, Bastion can tell them apart), that Bastion will automatically download both on launch and hourly, so any changes are automatically reflected in the bot. This field is optional - if it is left blank, the live update process will be disabled.  
  
`liveDBs` is an object with the same format as `staticDBs`, but it contains databases that *are* affected by the live update process, and its contents will change along with the contents of any `updateRepos`. You do not need to edit this field yourself - it will be populated during the live update process.  
  
`deleteOldDBs` is a boolean that determines if Bastion will delete a database from your hard drive that gets removed as part of the live update process (because it has been removed from the source repo). Note that even while enabled, you get a 10 second warning before files are deleted so that you can terminate the process if you decide you want to keep them. This field is optional - if it is left blank, that is equivalent to false.  
  
### Shortcuts  
By default, the shortcut file is called `shortcuts.json`, and is expected to be found in a subfolder of the local directory called `config`, i.e. `config/shortcuts.json`. The script expects `shortcut.json` to contain a JSON array of arrays, with contents like the following:  
```json  
[  
	[  
		"A0",  
		"AbZ.",  
		"AbZ",  
		"Elemental HERO Absolute Zero"  
	],  
	[  
		"AGGD",  
		"Ancient Gear Gadjiltron Dragon"  
	]  
]  
```  
The final entry in each array should be the full name of a card, for which all other entries are a shortened form of. Bastion splits queries up by spaces when checking for shortcuts, so shortcuts with a space will never be matched.  
  
### Setcodes  
By default, the setcode file is called `setcodes.json`, and is expected to be found in a subfolder of the local directory called `config`, i.e. `config/setcodes.json`. The script expects `setcodes.json` to contain a object, with hexadecimal setcodes as the keys and the names of the corresponding archetypes as the values, like so:  
```json  
{  
	"0x1": "Ally of Justice",  
	"0x2": "Genex"  
}  
```  
  
This file can be generated with the `setcodes2json.js` file. Simply run it as a node app in the same folder as a YGOPro `strings.conf` file, and it will output a `setcodes.json` that should be properly formatted.  
  
### Emotes  
By default, the emote file is called `emotes.json`, and is expected to be found in a subfolder of the local directory called `config`, i.e. `config/emotes.json`. The script expects `emotes.json` to contain a object, with string values as both the keys and the values, with minimal exceptions.  
  
```json  
{  
	"LIGHT": "",  
	"Aqua": "",  
	"thumbsup": "",  
	"thumbsdown": null,  
	"Equip": ""  
}  
```  
Keys are what the emotes are used to represent, and the values are the emote to use - either a literal emoji, or the Discord code for a custom emote in a server the bot will be in. You can get this by typing a backslash before the emote in Discord.  
Besides all monster types and attributes, and Spell/Trap subtypes, the following emotes are expected:  
`???`, used when Bastion fails to load a type or attribute.  
`thumbsup`, a positive reaction used when a correct answer is given in Trivia.  
`thumbsdown`, a negate reaction used when a wrong answer is given in Trivia. This can be left null to reduce spam/clutter.  
`NormalST`, representing a Normal Spell/Trap.  
`Level`, a Level star.  
`Rank`, a Rank star.  
`NLevel`, a Negative Level star, for anime Dark Synchros.  
`Link`, a symbol representing Link Rating.  
`L.Scale`, the left Pendulum Scale.  
`R.Scale`, the right Pendulum Scale.  
  
If using a custom emote for `thumbsup` or `thumbsdown`, leave out the `>` on the end.  
  
### Banlist  
By default, the banlist file is called `lflist.json`, and is expected to be found in a subfolder of the local directory called `config`, i.e. `config/lflist.json`. The script expects `lflist.json` to contain a object, with statuses (e.g. "TCG", "OCG") as the keys, and the values are further objects, with card IDs as keys and how many copies you are allowed in your deck as the value. If a card is not in the list, it is assumed to be unlimited.  
```json  
{  
	"TCG": {  
		"581014": 0,  
		"2295440": 1  
	},  
	"OCG": {  
		"423585": 2,  
		"1561110": 1  
	}  
}  
```  
  
This file can be generated with the `lflist2json.js` file. Simply run it as a node app in the same folder as a YGOPro `lflist.conf` file, and it will output an `lflist.json` that should be properly formatted. Note that it assumes the headings of each seperate banlist are in the format of "[date] [name]", i.e. it takes the word after the first space. If your `lflist.conf` is formatted differently, you can just go into the JSON and change the name of the key.  
  
### Skills  
By default, the skills file is called `skills.json`, and is expected to be found in a subfolder of the local directory called `dbs`, i.e. `dbs/skills.json`. The script expects `skills.json` to contain an array of objects, the format of which is described below.  
```json  
[  
	{  
		"name": "Aroma Strategy",  
		"desc": "You can look at the card at the very top of your Deck at any time.",  
		"chars": "Mai Valentine (Level 4)"  
	},  
	{  
		"name": "Baggy Sleeves",  
		"desc": "If one of your monsters of Level 5 or higher is destroyed in battle, in your next Draw Phase a normal draw gives you 2 cards.",  
		"chars": "Bandit Keith (Drop)"  
	}  
]  
```  
`name` is the name of the skill, `desc` is the skill's description, and `chars` is a list of characters that can obtain the skill, and how they do.  
  
### Stats  
By default, the stats file is called `stats.json`, and is expected to be found in a subfolder of the local directory called `config`, i.e. `config/stats.json`. The script expects `stats.json` to contain an object, with certain keys described below, the value of each being its own object, which can be empty.  
```json  
{  
	"searchRankings": {},  
	"inputRankings": {},  
	"cmdRankings": {}  
}  
```  
Each of these objects will be populated by Bastion and saved every 5 minutes of run-time, there is no need to modify it further yourself. For reference, `searchRankings` tracks how many times each card is looked up, `inputRankings` keeps track of all the different things people input to search for cards, and `cmdRankings` tracks how many times each command of the bot is used.  
  
### Sheets  
By default, the sheets file is called `sheets.json`, and is expected to be found in a subfolder of the local directory called `config`, i.e. `config/sheets.json`. The script expects `sheets.json` to contain an object, with keys which is your json name, the value of each being the Spreadsheet ID which is between `spreadsheets/d/` and `/edit` from your URL.  
```json  
	"constants": "",  
	"functions": "",  
	"parameters": "",  
	"skills": ""  
```  
  
### Database  
  
Bastion reads card databases from SQLite databases formatted the same way as those YGOPro uses. Because of this similarity, you can copy databases from YGOPro or edit them with programs like [DataEditorX](https://github.com/247321453/DataEditorX), so it should not be necessary to document the format here. If you do want to learn more about it, you can read [MichaelLawrenceDee's tutorial](https://www.ygopro.co/Forum/tabid/95/g/posts/t/16781/Scripting-Tutorial--CURRENTLY-INCOMPLETE#post88202) on custom card creation for YGOPro, which covers making Card Databases manually.  
  
A small note - Bastion detects if it needs to display monster stats for a Trap Card by checking for the TRAP_MONSTER type, 0x100, which not all simulators include in their databases - you may need to add this yourself.  
  
The schema for a card database is as follows:  
```sql  
CREATE TABLE IF NOT EXISTS "datas" (  
	`id`	integer,  
	`ot`	integer,  
	`alias`	INTEGER,  
	`setcode`	integer,  
	`type`	integer,  
	`atk`	integer,  
	`def`	integer,  
	`level`	integer,  
	`race`	integer,  
	`attribute`	integer,  
	`category`	integer,  
	PRIMARY KEY(id)  
);  
CREATE TABLE IF NOT EXISTS "texts" (  
	`id`	integer,  
	`name`	TEXT,  
	`desc`	TEXT,  
	`str1`	TEXT,  
	`str2`	TEXT,  
	`str3`	TEXT,  
	`str4`	TEXT,  
	`str5`	TEXT,  
	`str6`	TEXT,  
	`str7`	TEXT,  
	`str8`	TEXT,  
	`str9`	TEXT,  
	`str10`	TEXT,  
	`str11`	TEXT,  
	`str12`	TEXT,  
	`str13`	TEXT,  
	`str14`	TEXT,  
	`str15`	TEXT,  
	`str16`	TEXT,  
	PRIMARY KEY(id)  
);  
```  
  
### API  
  
Bastion expects 3 files in the `dbs` folder containing JSON arrays of objects detailing the functions, constants, and parameters in YGOPro's API. Examples of their format below.  
  
#### functions.json  
```json  
[  
	{  
		"sig": "int,int",  
		"name": "Card.GetOriginalCodeRule(Card c)",  
		"desc": "Gets the original code of a Card (Card c) (used for wording \"original name\")"  
	},  
	{  
		"sig": "bool",  
		"name": "Card.IsFusionCode(Card c, int code)",  
		"desc": "Checks if a Card (Card c) has a specific code (int code) (for Fusion Summons)"  
	}  
]  
```  
  
#### constants.json  
```json  
[  
	{  
		"val": "0x01",  
		"name": "LOCATION_DECK",  
		"desc": ""  
	},  
	{  
		"val": "0x02",  
		"name": "LOCATION_HAND",  
		"desc": ""  
	}  
]  
```  
  
#### parameters.json  
```json  
[  
	{  
		"type": "string",  
		"name": "any msg",  
		"desc": "A string in parantheses (can also include variables: 'Debug.Message(\"string1\"..var1..\"string2\")')"  
	},  
	{  
		"type": "bool",  
		"name": "cancel",  
		"desc": "Determines if it's cancelled or not"  
	}  
]  
```  
### To-do List  
- Add pack opening simulation --Feature simon has, but could be improved on  
- Grab pics and other files from online *or* local --Bonus  
- Improve ruling page lookup --questionably possible, requires formulaic way to determine OCG database ID from card data  
- Add OCG/Japanese prices if searching japanese language --questionably possible, requires source with API  
