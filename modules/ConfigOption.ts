export class ConfigOption<T> {
    public name: string;
    private val: T;
    private conv?: (val: any) => T;
    private chk?: (val: T) => boolean;
    constructor(name: string, defaultValue: any, conv?: (val: any) => T, chk?: (val: T) => boolean) {
        this.name = name;
        this.val = defaultValue;
        this.chk = chk;
        this.conv = conv;
    }

    set value(v: any) {
        let conVal: T;
        if (this.conv) {
            conVal = this.conv(v);
        } else {
            conVal = v as T;
        }
        if (!this.chk || this.chk(conVal)) {
            this.val = conVal;
        } else {
            throw new Error("Invalid value for config!");
        }
    }

    get value() {
        return this.val;
    }
}
