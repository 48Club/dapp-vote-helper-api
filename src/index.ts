import { fromHono } from "chanfana";
import { Hono } from "hono";
import { GetVote, GetUserVote, GetAllNodes, SM } from "./endpoints/get";
import { GetAllNodesTEST, SMTEST } from "./endpoints/get";
import { PostVote } from "./endpoints/post";

const app = new Hono<{ Bindings: Env }>();

const openapi = fromHono(app, {});

openapi.get("/api/v2/vote/list/:voteID", GetVote);
openapi.get("/api/v2/vote/user/:voteID", GetUserVote);
openapi.post("/api/v2/vote/:voteID", PostVote);

openapi.get("/api/v2/sm/all", GetAllNodes); // 获取当前节点列表
openapi.get("/api/v2/sm", SM); // 向节点后端发起请求

openapi.get("/api/v2/test_sm/all", GetAllNodesTEST); // 获取当前节点列表
openapi.get("/api/v2/test_sm", SMTEST); // 向节点后端发起请求

export default app;
