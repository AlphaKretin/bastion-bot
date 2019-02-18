"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const trivia_1 = require("../modules/trivia");
const names = ["trivia"];
const func = async (msg) => {
    await trivia_1.trivia(msg);
};
exports.cmd = new Command_1.Command(names, func);
//# sourceMappingURL=trivia.js.map