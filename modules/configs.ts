import * as fs from "mz/fs";
import { ConfigOption } from "./ConfigOption";
import { data } from "./data";

interface IConfigHandler {
    configs: {
        [name: string]: ConfigOption<any>;
    };
    setConfig: (opt: ConfigOption<any>) => void;
    getConfig: (name: string) => ConfigOption<any>;
}

export const config: IConfigHandler = {
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

const defaults = JSON.parse(fs.readFileSync("./config/defaultOpts.json", "utf8"));
// add default config options
config.setConfig(new ConfigOption<string>("prefix", defaults.prefix, val => val.toString().trim()));
config.setConfig(new ConfigOption<string>("defaultLang", "en", undefined, val => data.langs.includes(val)));
