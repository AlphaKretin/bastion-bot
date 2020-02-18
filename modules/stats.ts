import * as sqlite from "sqlite";
import * as fs from "mz/fs";
import * as Eris from "eris";
import { LangPayload } from "./util";

const statsDbPath = __dirname + "/../stats/stats.db3";
console.log(statsDbPath);
class Stats {
    private db: Promise<sqlite.Database>;
    constructor() {
    	this.db = this.getDB();
    }

    private async getDB(): Promise<sqlite.Database> {
    	const init = !(await fs.exists(statsDbPath));
    	const db = await sqlite.open(statsDbPath);
    	if (init) {
    		const dump = await fs.readFile(__dirname + "/../stats/stats.sql", "utf8");
    		await db.exec(dump);
    	}
    	return db;
    }

    public async writeSearch(msg: Eris.Message, userQuery: LangPayload, result: number, mobile: boolean): Promise<void> {
    	const db = await this.db;
    	const statement = await db.prepare("INSERT INTO cards VALUES(?,?,?,?,?,?,?,?)");
    	const snowflake = msg.id;
    	const chan = msg.channel;
    	const user = msg.author.id;
    	const server = chan instanceof Eris.GuildChannel ? chan.guild.id : user; //user === server indicates DM
    	const query = userQuery.msg;
    	const lang1 = userQuery.lang1;
    	const lang2 = userQuery.lang2;
    	await statement.run(snowflake, server, user, query, result, mobile, lang1, lang2);
    }
}

export const stats = new Stats();