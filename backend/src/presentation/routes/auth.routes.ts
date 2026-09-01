import { Router } from "express";

import { login, registerUser } from "../controllers/AuthController";

const router: Router = Router();

router.post("/register", registerUser);
router.post("/login", login);

export { router as authRoutes };
