import * as sqlite from "sqlite";
import * as fs from "mz/fs";
import * as Eris from "eris";
import { LangPayload } from "./util";

const statsDbPath = __dirname + "/../stats/stats.db3";
class Stats {
	private db: Promise<sqlite.Database>;
	constructor() {
		this.db = this.getDB();
	}

	private async getDB(): Promise<sqlite.Database> {
		const init = !(await fs.exists(statsDbPath));
		const db = await sqlite.open(statsDbPath);
		if (init) {
			const dump = await fs.readFile(__dirname + "/../stats/stats.db3.sql", "utf8");
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
	
	public async writeCommand(msg: Eris.Message, name: string): Promise<void> {
		const db = await this.db;
		const statement = await db.prepare("INSERT INTO commands VALUES(?,?,?,?,?)");
		const snowflake = msg.id;
		const chan = msg.channel;
		const user = msg.author.id;
		const server = chan instanceof Eris.GuildChannel ? chan.guild.id : user; //user === server indicates DM
		const args = msg.content;
		await statement.run(snowflake, server, user, name, args);
	}
	
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async topCards(count: number): Promise<any[]> {
		const db = await this.db;
		const statement = await db.prepare("SELECT result, COUNT(result) AS times "+ 
		"FROM cards GROUP BY result ORDER BY times DESC LIMIT ?");
		return await statement.all(count);

	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	/*public async topCommands(): Promise<any[]> {
		const db = await this.db;
		return await db.all("SELECT name, COUNT(name) AS times "+ 
			"FROM commands GROUP BY name ORDER BY times DESC");
	}*/
}

export const stats = new Stats();