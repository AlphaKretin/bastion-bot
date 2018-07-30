"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("mz/fs");
const ConfigOption_1 = require("./ConfigOption");
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
const defaults = JSON.parse(fs.readFileSync("../config/defaultOpts.json", "utf8"));
// add default config options
exports.config.setConfig(new ConfigOption_1.ConfigOption("prefix", defaults.prefix, val => val.toString().trim()));
//# sourceMappingURL=configs.js.map