import { Router } from "express";

import { registerUser } from "../controllers/AuthController";

const router: Router = Router();

router.post("/register", registerUser);

export { router as authRoutes };
