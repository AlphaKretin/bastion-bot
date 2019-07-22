import * as Eris from "eris";
export class Page<T, Extra = undefined> {
    get length(): number {
        return this.list.length;
    }

    get currentPage(): number {
        return Math.floor(this.index / 10) + 1;
    }

    get maxPage(): number {
        return Math.floor((this.length - 1) / 10) + 1;
    }
    public userID: string;
    public index: number;
    public msg: Eris.Message | undefined;
    public extra?: Extra;
    private list: T[];
    constructor(userID: string, list: T[], extra?: Extra) {
        this.userID = userID;
        this.list = list;
        this.index = 0;
        this.extra = extra;
    }

    public getCard(index: number): T {
        if (!(index in this.list)) {
            throw new Error("Out of MatchPage bounds!");
        }
        return this.list[index];
    }

    public getSpan(): T[] {
        return this.list.slice(this.index, Math.min(this.index + 10, this.list.length));
    }

    public canBack(): boolean {
        return this.index > 0;
    }

    public canForward(amt: number): boolean {
        return this.index + amt < this.list.length;
    }

    public back(amt: number): void {
        this.index = Math.max(0, this.index - amt);
    }

    public forward(amt: number): void {
        if (this.canForward(amt)) {
            this.index += amt;
        }
    }
}
