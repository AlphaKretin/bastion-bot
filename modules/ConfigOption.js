"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Eris = __importStar(require("eris"));
const fs = __importStar(require("mz/fs"));
const util_1 = require("./util");
class ConfigOption {
    constructor(name, defaultValue, conv, chk) {
        this.name = name;
        this.filePath = "./confs/" + this.name + ".json";
        if (fs.existsSync(this.filePath)) {
            this.val = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
        }
        else {
            this.val = {
                default: defaultValue
            };
        }
        this.chk = chk;
        this.conv = conv;
    }
    setValue(g, v) {
        if (g && g instanceof Eris.Message) {
            g = util_1.getGuildFromMsg(g);
        }
        if (v) {
            if (this.conv) {
                v = this.conv(v);
            }
            else {
                v = v;
            }
        }
        if (!this.chk || !v || this.chk(v, g)) {
            if (g) {
                if (!fs.existsSync("./confs")) {
                    fs.mkdirSync("./confs");
                }
                if (v) {
                    this.val[g.id] = v;
                    fs.writeFileSync(this.filePath, JSON.stringify(this.val, null, 4));
                    return 1;
                }
                else {
                    delete this.val[g.id];
                    fs.writeFileSync(this.filePath, JSON.stringify(this.val, null, 4));
                    return 0;
                }
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