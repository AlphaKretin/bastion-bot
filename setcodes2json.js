let fs = require('fs');
console.log("Reading strings file \"strings.conf\"...");
let file = fs.readFileSync("strings.conf", "utf-8");
console.log("Strings file found. Extracting setcodes...");
let setcodes = {};
for (let line of file.split("\r\n")) {
	if (line.startsWith("!setname")) {
		let code = line.split(" ")[1];
		let name = line.slice(line.indexOf(code) + code.length + 1);
		setcodes[code] = name;
	}
}
console.log("Setcodes assembled, writing to file...")
fs.writeFileSync("setcodes.json", JSON.stringify(setcodes), "utf-8");
console.log("All done!");