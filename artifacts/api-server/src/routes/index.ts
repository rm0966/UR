import { Router, type IRouter } from "express";
import healthRouter from "./health";
import botRouter from "./bot";
import codeRouter from "./code";

const router: IRouter = Router();

router.use(healthRouter);
router.use(botRouter);
router.use(codeRouter);

export default router;
