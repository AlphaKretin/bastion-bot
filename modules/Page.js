"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Page {
    constructor(userID, list) {
        this.userID = userID;
        this.list = list;
        this.index = 0;
    }
    get length() {
        return this.list.length;
    }
    get currentPage() {
        return Math.floor(this.index / 10) + 1;
    }
    get maxPage() {
        return Math.floor((this.length - 1) / 10) + 1;
    }
    getCard(index) {
        if (!(index in this.list)) {
            throw new Error("Out of MatchPage bounds!");
        }
        return this.list[index];
    }
    getSpan() {
        return this.list.slice(this.index, Math.min(this.index + 10, this.list.length));
    }
    canBack() {
        return this.index > 0;
    }
    canForward(amt) {
        return this.index + amt < this.list.length;
    }
    back(amt) {
        this.index = Math.max(0, this.index - amt);
    }
    forward(amt) {
        if (this.canForward(amt)) {
            this.index += amt;
        }
    }
}
exports.Page = Page;
//# sourceMappingURL=Page.js.map