import { fromHono } from "chanfana";
import { Hono } from "hono";
import { GetVote, GetUserVote } from "./endpoints/get";
import { PostVote } from "./endpoints/post";

const app = new Hono<{ Bindings: Env }>();

const openapi = fromHono(app, {});

openapi.get("/api/v2/vote/list/:voteID", GetVote);
openapi.get("/api/v2/vote/user/:voteID", GetUserVote);
openapi.post("/api/v2/vote/:voteID", PostVote);

export default app;
