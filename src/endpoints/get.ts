import { Bool, OpenAPIRoute } from "chanfana";
import { type AppContext } from "../types";
import { ethers } from "ethers";

export class GetVote extends OpenAPIRoute {
	async handle(c: AppContext) {
		const session = c.env.D1DB.withSession(`first-primary`);

		const result = await session
			.prepare(`SELECT * FROM vote_info WHERE vid = ?`)
			.bind(c.req.param("voteID"))
			.run();


		if (result.error || !result.success) return { code: 500, msg: result.error };

		let res = { "code": 200, "msg": null, "data": {} };

		result.results.forEach(element => {
			let tx_hash: any = element.tx_hash;
			if (res.data[tx_hash] === undefined) {
				res.data[tx_hash] = {
					"agree": 0,
					"dis": 0
				};
			}

			res.data[tx_hash][element.msg]++;
		});

		return res
	}
}

export class GetUserVote extends OpenAPIRoute {
	async handle(c: AppContext) {
		const session = c.env.D1DB.withSession(`first-primary`);
		// get user address from get param
		const address = c.req.param("address");
		const checksummed = ethers.getAddress(address);
		if (checksummed === ethers.ZeroAddress) {
			return { code: 400, msg: "Invalid address" };
		}

		const result = await session
			.prepare(`SELECT * FROM vote_info WHERE vid = ? AND address = ?`)
			.bind(c.req.param("voteID"))
			.bind(checksummed)
			.run();


		if (result.error || !result.success) return { code: 500, msg: result.error };

		let res = { "code": 200, "msg": null, "data": [] };
		result.results.forEach(element => {
			let tx_hash: any = element.tx_hash;
			res.data.push(tx_hash);
		});

		return res
	}
}
