import { Card } from "ygopro-data";

export class MatchPage {
    public userID: string;
    public index: number;
    private list: Card[];
    constructor(userID: string, list: Card[]) {
        this.userID = userID;
        this.list = list;
        this.index = 0;
    }

    get length(): number {
        return this.list.length;
    }

    get currentPage(): number {
        return Math.floor(this.index / 10) + 1;
    }

    get maxPage(): number {
        return Math.floor((this.length - 1) / 10) + 1;
    }

    public getCard(index: number): Card {
        if (!(index in this.list)) {
            throw new Error("Out of MatchPage bounds!");
        }
        return this.list[index];
    }

    public getSpan(): Card[] {
        return this.list.slice(this.index, Math.min(this.index + 10, this.list.length - 1));
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

export const matchPages: { [serverID: string]: MatchPage } = {};
