import { command as commands } from "./commands";
import { command as config } from "./config";
import { command as constant } from "./constant";
import { command as counter } from "./counter";
import { command as dbfind } from "./dbfind";
import { command as deck } from "./deck";
import { command as desc } from "./desc";
import { command as effect } from "./effect";
import { command as func } from "./function";
import { command as help } from "./help";
import { command as id } from "./id";
import { command as link } from "./link";
import { command as matches } from "./matches";
import { command as mDesc } from "./mDesc";
import { command as metrics } from "./metrics";
import { command as mPage } from "./mPage";
import { command as page } from "./page";
import { command as param } from "./param";
import { command as ping } from "./ping";
import { command as randcard } from "./randcard";
import { command as rulings } from "./rulings";
import { command as script } from "./script";
import { command as search } from "./search";
import { command as set } from "./set";
import { command as skill } from "./skill";
import { command as stats } from "./stats";
import { command as tlock } from "./tlock";
import { command as top } from "./top";
import { command as trivia } from "./trivia";
import { command as update } from "./update";
import { command as yugi } from "./yugi";
import { Command } from "../modules/Command";

export const cmds: Command[] = [
	commands,
	config,
	constant,
	counter,
	dbfind,
	deck,
	desc,
	effect,
	func,
	help,
	id,
	link,
	matches,
	mDesc,
	metrics,
	mPage,
	page,
	param,
	ping,
	randcard,
	rulings,
	script,
	search,
	set,
	skill,
	stats,
	tlock,
	top,
	trivia,
	update,
	yugi
];
