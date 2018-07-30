"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
// add default config options
exports.config.setConfig(new ConfigOption_1.ConfigOption("prefix", ".", val => val.toString().trim()));
//# sourceMappingURL=configs.js.map