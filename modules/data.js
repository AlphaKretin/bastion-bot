"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("mz/fs");
const ygopro_data_1 = require("ygopro-data");
const dataOpts = JSON.parse(fs.readFileSync("config/dataOpts.json", "utf8"));
exports.data = new ygopro_data_1.Driver(dataOpts);
//# sourceMappingURL=data.js.map