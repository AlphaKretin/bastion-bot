import { Message } from "eris";
import { Command } from "../modules/Command";
import { trivia, getLock } from "../modules/trivia";

const names = ["trivia"];
const func = async (msg: Message): Promise<void> => {
	await trivia(msg);
};

const cond = getLock;

const desc =
	"Plays a game where Bastion displays a card image, and plays have a time limit to name the displayed card.\n" +
	"If you specify a number of rounds, the game will end when the total score of all players reaches that value.\n" +
	'Include the optional "hard" parameter, Bastion will only display one corner of the image.\n' +
	"For details on the filter system, see https://github.com/AlphaKretin/ygo-data/wiki/Filter-system.";

export const command = new Command(names, func, cond, desc, "rounds lang hard|filter");
