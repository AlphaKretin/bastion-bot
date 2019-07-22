"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("../modules/Command");
const trivia_1 = require("../modules/trivia");
const names = ["trivia"];
const func = async (msg) => {
    await trivia_1.trivia(msg);
};
const desc = "Plays a game where Bastion displays a card image, and plays have a time limit to name the displayed card.\n" +
    "If you specify a number of rounds, the game will end when the total score of all players reaches that value.\n" +
    'Include the optional "hard" parameter, Bastion will only display one corner of the image.\n' +
    "For details on the filter system, yell at AlphaKretin to add a link here.";
exports.cmd = new Command_1.Command(names, func, undefined, desc, "rounds lang hard|filter");
//# sourceMappingURL=trivia.js.map