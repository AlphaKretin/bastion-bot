import * as fs from "mz/fs";
import { ConfigOption } from "./ConfigOption";
import { data } from "./data";
import { Errors } from "./errors";

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

function explicitParseInt(n: string): number {
    if (n.startsWith("0x")) {
        return parseInt(n, 16);
    }
    return parseInt(n, 10);
}

const defaults = JSON.parse(fs.readFileSync("./config/defaultOpts.json", "utf8"));
// add default config options
config.setConfig(new ConfigOption<string>("prefix", defaults.prefix, val => val.toString().trim()));
config.setConfig(
    new ConfigOption<string>("defaultLang", defaults.language, undefined, val => data.langs.includes(val))
);
config.setConfig(
    new ConfigOption<number>(
        "embedColor",
        defaults.embedColor,
        val => explicitParseInt(val),
        val => val.toString(16).length === 6
    )
);
config.setConfig(
    new ConfigOption<[string, string]>(
        "fullBrackets",
        defaults.fullBrackets,
        (val: string) => {
            const s = val.split("");
            return [s[0], s[1]];
        },
        (val, m) => {
            if (val.length < 2 || !val[1]) {
                return false;
            }
            const mobBrackets = config.getConfig("mobBrackets").getValue(m);
            const noImgMobBrackets = config.getConfig("noImgMobBrackets").getValue(m);

            return (
                val[0].length === 1 &&
                val[1].length === 1 &&
                mobBrackets.indexOf(val[0]) === -1 &&
                mobBrackets.indexOf(val[1]) === -1 &&
                noImgMobBrackets.indexOf(val[0]) === -1 &&
                noImgMobBrackets.indexOf(val[1]) === -1
            );
        }
    )
);

config.setConfig(
    new ConfigOption<[string, string]>(
        "mobBrackets",
        defaults.mobBrackets,
        (val: string) => {
            const s = val.split("");
            return [s[0], s[1]];
        },
        (val, m) => {
            if (val.length < 2 || !val[1]) {
                return false;
            }
            const fullBrackets = config.getConfig("fullBrackets").getValue(m);
            const noImgMobBrackets = config.getConfig("noImgMobBrackets").getValue(m);
            return (
                val[0].length === 1 &&
                val[1].length === 1 &&
                fullBrackets.indexOf(val[0]) === -1 &&
                fullBrackets.indexOf(val[1]) === -1 &&
                noImgMobBrackets.indexOf(val[0]) === -1 &&
                noImgMobBrackets.indexOf(val[1]) === -1
            );
        }
    )
);

config.setConfig(
    new ConfigOption<[string, string]>(
        "noImgMobBrackets",
        defaults.noImgMobBrackets,
        (val: string) => {
            const s = val.split("");
            return [s[0], s[1]];
        },
        (val, m) => {
            if (val.length < 2 || !val[1]) {
                return false;
            }
            const fullBrackets = config.getConfig("fullBrackets").getValue(m);
            const mobBrackets = config.getConfig("mobBrackets").getValue(m);
            return (
                val[0].length === 1 &&
                val[1].length === 1 &&
                fullBrackets.indexOf(val[0]) === -1 &&
                fullBrackets.indexOf(val[1]) === -1 &&
                mobBrackets.indexOf(val[0]) === -1 &&
                mobBrackets.indexOf(val[1]) === -1
            );
        }
    )
);

// boolean configs need to be false by default or else they convert wrong. wEaK tYpInG iS fInE
config.setConfig(new ConfigOption<boolean>("mobileView", false, Boolean));
config.setConfig(new ConfigOption("suppressEmotes", false, Boolean));

export const colors = JSON.parse(fs.readFileSync("./config/colors.json", "utf8"));
export const emotes = JSON.parse(fs.readFileSync("./config/emotes.json", "utf8"));
