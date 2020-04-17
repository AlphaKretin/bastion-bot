import Fuse from "fuse.js";
import { skills as skillSheet } from "../config/sheetOpts.json";
import { CSVResult } from "./libraryPages";
import fetch from "node-fetch";
import parse from "csv-parse";

interface Skill {
	name: string;
	desc: string;
	chars: string;
}

class Skills {
	private fuseOpts: Fuse.FuseOptions<Skill> = {
		distance: 100,
		keys: ["name"],
		location: 0,
		maxPatternLength: 52,
		minMatchCharLength: 1,
		shouldSort: true,
		threshold: 0.25,
		tokenize: true
	};
	private fuse: Promise<Fuse<Skill, Fuse.FuseOptions<Skill>>>;
	constructor() {
		this.fuse = this.getFuse();
	}

	public async update(): Promise<void> {
		await (this.fuse = this.getFuse());
	}

	private async extract(url: string): Promise<CSVResult> {
		const file = await fetch(url);
		const csv = await file.text();
		const data = await new Promise<CSVResult>((resolve, reject) => {
			parse(csv, (err, data: CSVResult) => {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
		return data;
	}

	private async getFuse(): Promise<Fuse<Skill, Fuse.FuseOptions<Skill>>> {
		const data = await this.extract(skillSheet);
		const sheet = Object.values(data).filter(s => s.length > 0);
		if (!sheet) {
			throw new Error("Could not load skill sheet!");
		}
		const input: Skill[] = sheet.map(row => ({ name: row[0], desc: row[1], chars: row[2] }));
		return new Fuse(input, this.fuseOpts);
	}

	public async getSkill(query: string): Promise<Skill | undefined> {
		const results = (await this.fuse).search(query);
		if (results.length < 1) {
			return undefined;
		}
		const result = results[0];
		if ("name" in result) {
			return result;
		}
		return result.item;
	}
}

export const skills = new Skills();
