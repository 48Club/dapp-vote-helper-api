import { OpenAPIRoute } from "chanfana";
import { type AppContext } from "../types";
import { ethers } from "ethers";
import { Buffer } from "buffer";

export class PostVote extends OpenAPIRoute {
	async handle(c: AppContext) {

		let data = await c.req.json();
		let voteID = c.req.param("voteID"); // 投票 ID
		let msgHash = Buffer.from(`${voteID}:{"msg":"${data.msg}","tx_hash":"${data.tx_hash}"}`, "utf8"); // 用户签名原文
		let address = ethers.verifyMessage(msgHash, data.sign); // 还原用户地址

		let checksummed = ethers.getAddress(data.address.toLowerCase());
		if (checksummed !== address) return { code: 401, msg: "Invalid signature" };

		const session = c.env.D1DB.withSession(`first-primary`);

		const result = await session
			.prepare(`SELECT * FROM vote_info WHERE vid = ? AND address = ? AND tx_hash = ?`)
			.bind(voteID, address, data.tx_hash)
			.run();


		if (result.error || !result.success) return { code: 500, msg: result.error };

		if (result.results.length > 0) return { code: 401, msg: "Already voted" };


		const insertResult = await session
			.prepare(`INSERT INTO vote_info (vid, address, tx_hash, msg) VALUES (?, ?, ?, ?)`)
			.bind(voteID, address, data.tx_hash, data.msg)
			.run();

		if (insertResult.error || !insertResult.success) return { code: 500, msg: insertResult.error };

		return { code: 200, msg: null, };
	}
}
