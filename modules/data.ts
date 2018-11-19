import * as fs from "mz/fs";
import { Driver as ygoData } from "ygopro-data";

const dataOpts = JSON.parse(fs.readFileSync("config/dataOpts.json", "utf8"));
export const data = new ygoData(dataOpts);
export const imageExt = dataOpts.imageExt;
