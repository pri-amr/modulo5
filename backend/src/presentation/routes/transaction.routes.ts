import { Router } from "express";

import { createTransaction } from "../controllers/TransactionController";
import { resolveSeedUser } from "../middlewares/resolveSeedUser";

const router: Router = Router();

router.post("/", resolveSeedUser, createTransaction);

export { router as transactionRoutes };
