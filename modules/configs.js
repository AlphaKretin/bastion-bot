"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = {
    configs: {},
    setConfig(opt) {
        this.configs[opt.name] = opt;
    },
    getConfig(name) {
        if (name in this.configs) {
            return this.configs[name];
        }
    }
};
//# sourceMappingURL=configs.js.map