import * as Eris from "eris";
import { getGuildFromMsg } from "./util";

interface IValueTable<T> {
    [guild: string]: T;
}

export class ConfigOption<T> {
    public name: string;
    private val: IValueTable<T>;
    private conv?: (val: any) => T;
    private chk?: (val: T) => boolean;
    constructor(name: string, defaultValue: T, conv?: (val: any) => T, chk?: (val: T) => boolean) {
        this.name = name;
        this.val = {
            default: defaultValue
        };
        this.chk = chk;
        this.conv = conv;
    }

    public setValue(v: any, g?: Eris.Guild | Eris.Message) {
        let conVal: T;
        if (g && g instanceof Eris.Message) {
            g = getGuildFromMsg(g);
        }
        if (this.conv) {
            conVal = this.conv(v);
        } else {
            conVal = v as T;
        }
        if (!this.chk || this.chk(conVal)) {
            if (g) {
                this.val[g.id] = conVal;
            } else {
                throw new Error("Cannot set config except for a guild!");
            }
        } else {
            throw new Error("Invalid value for config!");
        }
    }

    public getValue(g?: Eris.Guild | Eris.Message) {
        if (g && g instanceof Eris.Message) {
            g = getGuildFromMsg(g);
        }
        if (g && g.id in this.val) {
            return this.val[g.id];
        }
        return this.val.default;
    }
}
