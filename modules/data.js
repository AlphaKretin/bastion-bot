"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("mz/fs"));
const ygopro_data_1 = require("ygopro-data");
const dataOpts = JSON.parse(fs.readFileSync("config/dataOpts.json", "utf8"));
exports.data = new ygopro_data_1.YgoData("config/dataOpts.json", "dbs/");
exports.imageExt = dataOpts.imageExt;
//# sourceMappingURL=data.js.map