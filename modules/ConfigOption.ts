import * as Eris from "eris";
import * as fs from "mz/fs";
import { getGuildFromMsg } from "./util";

interface IValueTable<T> {
    [guild: string]: T;
}

export class ConfigOption<T> {
    public name: string;
    private val: IValueTable<T>;
    private filePath: string;
    private conv?: (val: any) => T;
    private chk?: (val: T, m: Eris.Message | Eris.Guild) => boolean;
    constructor(
        name: string,
        defaultValue: T,
        conv?: (val: any) => T,
        chk?: (val: T, m: Eris.Message | Eris.Guild) => boolean
    ) {
        this.name = name;
        this.filePath = "./confs/" + this.name + ".json";
        if (fs.existsSync(this.filePath)) {
            this.val = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
        } else {
            this.val = {
                default: defaultValue
            };
        }
        this.chk = chk;
        this.conv = conv;
    }

    public setValue(g: Eris.Guild | Eris.Message, v?: any): number {
        if (g && g instanceof Eris.Message) {
            g = getGuildFromMsg(g);
        }
        if (v) {
            if (this.conv) {
                v = this.conv(v);
            } else {
                v = v as T;
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
                } else {
                    delete this.val[g.id];
                    fs.writeFileSync(this.filePath, JSON.stringify(this.val, null, 4));
                    return 0;
                }
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
