import { Router } from "express";

import { createTransaction } from "../controllers/TransactionController";

const router: Router = Router();

router.post("/", createTransaction);

export { router as transactionRoutes };
