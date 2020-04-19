import { YgoData } from "ygopro-data";
import * as CardOpts from "../config/cardOpts.json";
import * as TransOpts from "../config/transOpts.json";
import * as MiscOpts from "../config/dataOpts.json";
require("dotenv").config();

export const data = new YgoData(CardOpts, TransOpts, MiscOpts, "dbs/", process.env.GITHUB_TOKEN);

const autoUpdateInterval = 1000 * 60 * 60 * 24; //1k ms/s * 60 s/m * 60m/h * 24h/day
setInterval(() => {
	console.log("Starting auto-update!");
	data.update().catch(e => console.error(e));
}, autoUpdateInterval);
