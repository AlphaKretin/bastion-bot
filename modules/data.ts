import * as fs from "mz/fs";
import { YgoData } from "ygopro-data";

const dataOpts = JSON.parse(fs.readFileSync("config/dataOpts.json", "utf8"));
export const data = new YgoData("config/dataOpts.json", "dbs/");
export const imageExt = dataOpts.imageExt;
