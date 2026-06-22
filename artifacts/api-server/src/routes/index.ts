import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import usersRouter from "./users";
import paymentsRouter from "./payments";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(openaiRouter);
router.use("/users", usersRouter);
router.use("/payments", paymentsRouter);
router.use("/admin", adminRouter);

export default router;
