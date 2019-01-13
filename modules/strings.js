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
const configs_1 = require("./configs");
class Strings {
    constructor(file) {
        this.trans = JSON.parse(fs.readFileSync(file, "utf8"));
    }
    getTranslation(prop, lang, msg, val) {
        let v;
        if (val) {
            v = val.toString();
        }
        let out;
        if (lang in this.trans && prop in this.trans[lang]) {
            out = this.trans[lang][prop];
        }
        else {
            const def = configs_1.config.getConfig("defaultLang").getValue(msg);
            out = this.trans[def][prop];
        }
        if (v) {
            out = out.replace(/%s/g, v);
        }
        return out;
    }
}
exports.strings = new Strings("./config/strings.json");
//# sourceMappingURL=strings.js.map