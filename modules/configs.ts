import { ConfigOption } from "./ConfigOption";

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

// add default config options
config.setConfig(new ConfigOption<string>("prefix", ".", val => val.toString().trim()));
