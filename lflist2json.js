let fs = require('fs');
console.log("Reading banlist file \"lflist.conf\"...");
let file = fs.readFileSync("lflist.conf", "utf-8");
console.log("Banlist file found. Converting...");
let lflist = {};
let currentList = "";
for (let line of file.split("\r\n")) {
	if (line.startsWith("#")) {
		continue;
	}
	if (line.startsWith("!")) {
		currentList = line.split(" ")[1];
		lflist[currentList] = {};
		console.log("Reading " + currentList + " banlist..")
		continue;
	}
	lflist[currentList][line.split(" ")[0]] = line.split(" ")[1];
}
console.log("Banlist assembled, writing to file...")
fs.writeFileSync("lflist.json", JSON.stringify(lflist), "utf-8");
console.log("All done!");