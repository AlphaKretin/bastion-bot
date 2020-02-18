import * as fs from "mz/fs";
import { YgoData } from "ygopro-data";

const dataOpts = JSON.parse(fs.readFileSync("config/dataOpts.json", "utf8"));
export const data = new YgoData("config/dataOpts.json", "dbs/");
export const imageExt = dataOpts.imageExt;

const autoUpdateInterval = 1000 * 60 * 60 * 24; //1k ms/s * 60 s/m * 60m/h * 24h/day
setInterval(() => {
	console.log("Starting auto-update!");
	data.update().catch(e => console.error(e));
}, autoUpdateInterval);