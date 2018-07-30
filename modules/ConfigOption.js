"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConfigOption {
    constructor(name, defaultValue, conv, chk) {
        this.name = name;
        this.val = {
            default: defaultValue
        };
        this.chk = chk;
        this.conv = conv;
    }
    setValue(v, g) {
        let conVal;
        if (this.conv) {
            conVal = this.conv(v);
        }
        else {
            conVal = v;
        }
        if (!this.chk || this.chk(conVal)) {
            if (g) {
                this.val[g.id] = conVal;
            }
            else {
                throw new Error("Cannot set config except for a guild!");
            }
        }
        else {
            throw new Error("Invalid value for config!");
        }
    }
    getValue(g) {
        if (g && g.id in this.val) {
            return this.val[g.id];
        }
        return this.val.default;
    }
}
exports.ConfigOption = ConfigOption;
//# sourceMappingURL=ConfigOption.js.map