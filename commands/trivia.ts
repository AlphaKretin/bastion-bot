import * as Eris from "eris";
import { Command } from "../modules/Command";
import { trivia } from "../modules/trivia";

const names = ["trivia"];
const func = async (msg: Eris.Message) => {
    await trivia(msg);
};

const desc =
    "Plays a game where Bastion displays a card image, and plays have a time limit to name the displayed card.\n" +
    "If you specify a number of rounds, the game will end when the total score of all players reaches that value.\n" +
    'Include the optional "hard" parameter, Bastion will only display one corner of the image.\n' +
    "For details on the filter system, yell at AlphaKretin to add a link here.";

export const cmd = new Command(names, func, undefined, desc, "rounds lang hard|filter");
