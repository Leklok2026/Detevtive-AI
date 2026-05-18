import { Router, type IRouter } from "express";
import healthRouter from "./health";
import casesRouter from "./cases";
import playersRouter from "./players";
import interrogationRouter from "./interrogation";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(casesRouter);
router.use(playersRouter);
router.use(interrogationRouter);
router.use(adminRouter);

export default router;
