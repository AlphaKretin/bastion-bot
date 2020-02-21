import * as sqlite from "sqlite";
import * as fs from "mz/fs";
import * as Eris from "eris";
import { LangPayload } from "./util";

const statsDbPath = __dirname + "/../stats/stats.db3";

interface Metrics {
	activeUsers: number;
	cardCount: number;
	commandCount: number;
	cardsPerUser: number;
	commandsPerUser: number;
}

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

	public async getMetrics(): Promise<Metrics> {
		const db = await this.db;
		const activeUsers = Object.values(await db.get("SELECT COUNT(user) FROM (SELECT user FROM cards UNION SELECT user FROM commands)"))[0] as number;
		const cardCount = Object.values(await db.get("SELECT SUM(times) FROM (SELECT result, COUNT(result) AS times FROM cards GROUP BY result) s"))[0] as number;
		const commandCount = Object.values(await db.get("SELECT SUM(times) FROM (SELECT name, COUNT(name) AS times FROM commands GROUP BY name) s"))[0] as number;
		const cardsPerUser = Object.values(await db.get("SELECT CAST(x.number AS REAL) / CAST(y.number AS REAL) FROM "+
			"(SELECT SUM(times) as number FROM "+
			"(SELECT result, COUNT(result) AS times FROM cards GROUP BY result) "+
			") x JOIN "+
			"(SELECT COUNT(user) as number FROM "+
			"(SELECT user, COUNT(user) as times FROM cards GROUP BY user)"+
			") y on 1=1"))[0] as number;
		const commandsPerUser = Object.values(await db.get("SELECT CAST(x.number AS REAL) / CAST(y.number AS REAL) FROM "+
			"(SELECT SUM(times) as number FROM "+
			"(SELECT name, COUNT(name) AS times FROM commands GROUP BY name) "+
			") x JOIN "+
			"(SELECT COUNT(user) as number FROM "+
			"(SELECT user, COUNT(user) as times FROM commands GROUP BY user)"+
			") y on 1=1"))[0] as number;
		return { activeUsers, cardCount, commandCount, cardsPerUser, commandsPerUser };
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	/*public async topCommands(): Promise<any[]> {
		const db = await this.db;
		return await db.all("SELECT name, COUNT(name) AS times "+ 
			"FROM commands GROUP BY name ORDER BY times DESC");
	}*/
}

export const stats = new Stats();