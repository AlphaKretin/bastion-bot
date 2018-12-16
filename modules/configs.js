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
const ConfigOption_1 = require("./ConfigOption");
const data_1 = require("./data");
exports.config = {
    configs: {},
    setConfig(opt) {
        this.configs[opt.name] = opt;
    },
    getConfig(name) {
        if (name in this.configs) {
            return this.configs[name];
        }
        throw new Error("Could not find config");
    }
};
function explicitParseInt(n) {
    if (n.startsWith("0x")) {
        return parseInt(n, 16);
    }
    return parseInt(n, 10);
}
const defaults = JSON.parse(fs.readFileSync("./config/defaultOpts.json", "utf8"));
// add default config options
exports.config.setConfig(new ConfigOption_1.ConfigOption("prefix", defaults.prefix, val => val.toString().trim()));
exports.config.setConfig(new ConfigOption_1.ConfigOption("defaultLang", defaults.language, undefined, val => data_1.data.langs.includes(val)));
exports.config.setConfig(new ConfigOption_1.ConfigOption("embedColor", defaults.embedColor, val => explicitParseInt(val), val => val.toString(16).length === 6));
exports.colors = JSON.parse(fs.readFileSync("./config/colors.json", "utf8"));
//# sourceMappingURL=configs.js.map