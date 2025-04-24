import { Bool, OpenAPIRoute } from "chanfana";
import { type AppContext } from "../types";

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
