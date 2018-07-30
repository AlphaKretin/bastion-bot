import { ConfigOption } from "./ConfigOption";

interface IConfigHandler {
    configs: {
        [name: string]: ConfigOption<any>;
    };
    setConfig: (opt: ConfigOption<any>) => void;
    getConfig: (name: string) => ConfigOption<any> | undefined;
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
    }
};
