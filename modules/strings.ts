import * as Eris from "eris";
import * as fs from "mz/fs";
import { config } from "./configs";

class Strings {
    private trans: { [lang: string]: { [prop: string]: string } };
    constructor(file: string) {
        this.trans = JSON.parse(fs.readFileSync(file, "utf8"));
    }
    public getTranslation(prop: string, lang: string, msg?: Eris.Message, val?: any): string {
        let v: string | undefined;
        if (val) {
            v = val.toString();
        }
        let out: string;
        if (lang in this.trans && prop in this.trans[lang]) {
            out = this.trans[lang][prop];
        } else {
            const def = config.getConfig("defaultLang").getValue(msg);
            out = this.trans[def][prop];
        }
        if (v) {
            out = out.replace(/%s/g, v);
        }
        return out;
    }
}

export const strings = new Strings("./config/strings.json");
