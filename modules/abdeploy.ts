import fetch from "node-fetch";

// See https://github.com/DawnbrandBots/bastion-bot/blob/master/src/abdeploy.ts
let abdeploy: Set<string> | null = null;

async function update(initial = false): Promise<void> {
	if (process.env.ABDEPLOY_URL) {
	// Synchronise on the hour
		const now = new Date();
		if (initial || new Date().getMinutes() === 0) {
			console.log(`${now.toISOString()} Updating ABDeploy`);
			try {
				const response = await fetch(process.env.ABDEPLOY_URL);
				abdeploy = new Set(await response.json());
				console.log(`ABDeploy read ${abdeploy.size} entries`);
			} catch (error) {
				console.error(error);
			}
		}
	}
}

void update(true);
setInterval(update, 60000);

export default abdeploy;