import Fuse from "fuse.js";
import { extractSheets, SheetResults } from "spreadsheet-to-json";
import { sheetOpts } from "./libraryPages";

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

	private extract(spreadsheetKey: string): Promise<SheetResults> {
		return new Promise((resolve, reject) => {
			extractSheets({ spreadsheetKey, sheetsToExtract: ["skills"] }, (err, data) => {
				if (err) {
					return reject(err);
				}
				resolve(data);
			});
		});
	}

	private async getFuse(): Promise<Fuse<Skill, Fuse.FuseOptions<Skill>>> {
		const data = await this.extract(sheetOpts.skills);
		const sheet = Object.values(data).find(s => s.length > 0);
		const input: Skill[] = [];
		if (!sheet) {
			throw new Error("Could not load skill sheet!");
		}
		for (const row of sheet) {
			input.push({ name: row.name, desc: row.desc, chars: row.chars });
		}
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