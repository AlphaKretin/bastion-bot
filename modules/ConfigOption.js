"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Eris = require("eris");
const util_1 = require("./util");
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
        if (g && g instanceof Eris.Message) {
            g = util_1.getGuildFromMsg(g);
        }
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
        if (g && g instanceof Eris.Message) {
            g = util_1.getGuildFromMsg(g);
        }
        if (g && g.id in this.val) {
            return this.val[g.id];
        }
        return this.val.default;
    }
}
exports.ConfigOption = ConfigOption;
//# sourceMappingURL=ConfigOption.js.map