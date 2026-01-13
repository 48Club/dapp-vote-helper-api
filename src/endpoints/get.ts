import { OpenAPIRoute } from "chanfana";
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
		const address = c.req.query("address");
		const checksummed = ethers.getAddress(address.toLowerCase());
		if (checksummed === ethers.ZeroAddress) {
			return { code: 400, msg: "Invalid address" };
		}

		const result = await session
			.prepare(`SELECT * FROM vote_info WHERE vid = ? AND address = ?`)
			.bind(c.req.param("voteID"), checksummed)
			.run();


		if (result.error || !result.success) return { code: 500, msg: result.error };

		let res = { "code": 200, "msg": null, "data": {} };
		result.results.forEach(element => {
			let tx_hash: any = element.tx_hash;
			res.data[tx_hash] = {
				agree: element.msg === 'agree',
				dis: element.msg === 'dis'
			}
		});

		return res
	}
}


export class GetAllNodes extends OpenAPIRoute {
	async handle(c: AppContext) {
		const Authorization = c.req.header("Authorization");
		if (Authorization !== c.env.API_TOKEN) return { code: 403, msg: "Forbidden" };

		const session = c.env.D1SMDB.withSession(`first-primary`);

		const result = await session.prepare(`SELECT * FROM nodes`).run();

		if (result.error || !result.success) return { code: 500, msg: result.error };

		let res = { "code": 200, "msg": null, "data": [] };

		result.results.forEach(element => { res.data.push({ id: element.id, loc: element.loc, }) });

		return res
	}
}

export class SM extends OpenAPIRoute {
	async handle(c: AppContext) {
		const Authorization = c.req.header("Authorization");

		if (Authorization !== c.env.API_TOKEN) return { code: 403, msg: "Forbidden" };

		const nodeID = c.req.query("id");
		if (!nodeID) return { "code": 400, "msg": "Node ID is required", "data": null };


		const doAction = c.req.query("do_action");
		var method = "GET";
		if (["upgrade", "upgrade_geth"].includes(doAction)) method = "POST"; // 升级操作使用 POST 方法

		var argsList = [];
		const version = c.req.query("version");
		if (version) argsList.push(`version=${version}`);

		const result = await c.env.D1SMDB.prepare(`SELECT * FROM nodes WHERE id = ?`).bind(nodeID).first();
		if (!result) return { "code": 400, "msg": "Node ID is required", "data": null } // 未找到对应节点
		if (result.db_path) argsList.push(`db_path=${result.db_path}`); // 非空则添加参数
		if (result.ipc_path) argsList.push(`ipc_path=${result.ipc_path}`);

		const args = argsList.join("&");
		var apiEndpoint = `http://${result.ip}.nip.io:30000/api/${doAction}`;
		if (args) apiEndpoint += "?" + args;

		const response = await fetch(apiEndpoint, {
			method: method,
			headers: {
				'Authorization': Authorization,
			},
		});

		if (response.status !== 200) return { "code": response.status, "msg": "Error from node", "data": null }
		return await response.json();
	}
}