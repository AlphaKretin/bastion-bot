"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConfigOption {
    constructor(name, defaultValue, conv, chk) {
        this.name = name;
        this.val = defaultValue;
        this.chk = chk;
        this.conv = conv;
    }
    set value(v) {
        let conVal;
        if (this.conv) {
            conVal = this.conv(v);
        }
        else {
            conVal = v;
        }
        if (!this.chk || this.chk(conVal)) {
            this.val = conVal;
        }
        else {
            throw new Error("Invalid value for config!");
        }
    }
    get value() {
        return this.val;
    }
}
exports.ConfigOption = ConfigOption;
//# sourceMappingURL=ConfigOption.js.map