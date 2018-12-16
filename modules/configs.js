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
exports.config.setConfig(new ConfigOption_1.ConfigOption("fullBrackets", defaults.fullBrackets, (val) => {
    const s = val.split("");
    return [s[0], s[1]];
}, (val, m) => {
    if (val.length < 2 || !val[1]) {
        return false;
    }
    const mobBrackets = exports.config.getConfig("mobBrackets").getValue(m);
    const noImgMobBrackets = exports.config.getConfig("noImgMobBrackets").getValue(m);
    return (val[0].length === 1 &&
        val[1].length === 1 &&
        mobBrackets.indexOf(val[0]) === -1 &&
        mobBrackets.indexOf(val[1]) === -1 &&
        noImgMobBrackets.indexOf(val[0]) === -1 &&
        noImgMobBrackets.indexOf(val[1]) === -1);
}));
exports.config.setConfig(new ConfigOption_1.ConfigOption("mobBrackets", defaults.mobBrackets, (val) => {
    const s = val.split("");
    return [s[0], s[1]];
}, (val, m) => {
    if (val.length < 2 || !val[1]) {
        return false;
    }
    const fullBrackets = exports.config.getConfig("fullBrackets").getValue(m);
    const noImgMobBrackets = exports.config.getConfig("noImgMobBrackets").getValue(m);
    return (val[0].length === 1 &&
        val[1].length === 1 &&
        fullBrackets.indexOf(val[0]) === -1 &&
        fullBrackets.indexOf(val[1]) === -1 &&
        noImgMobBrackets.indexOf(val[0]) === -1 &&
        noImgMobBrackets.indexOf(val[1]) === -1);
}));
exports.config.setConfig(new ConfigOption_1.ConfigOption("noImgMobBrackets", defaults.noImgMobBrackets, (val) => {
    const s = val.split("");
    return [s[0], s[1]];
}, (val, m) => {
    if (val.length < 2 || !val[1]) {
        return false;
    }
    const fullBrackets = exports.config.getConfig("fullBrackets").getValue(m);
    const mobBrackets = exports.config.getConfig("mobBrackets").getValue(m);
    return (val[0].length === 1 &&
        val[1].length === 1 &&
        fullBrackets.indexOf(val[0]) === -1 &&
        fullBrackets.indexOf(val[1]) === -1 &&
        mobBrackets.indexOf(val[0]) === -1 &&
        mobBrackets.indexOf(val[1]) === -1);
}));
exports.colors = JSON.parse(fs.readFileSync("./config/colors.json", "utf8"));
//# sourceMappingURL=configs.js.map