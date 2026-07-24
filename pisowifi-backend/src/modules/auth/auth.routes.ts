import { Router } from "express";
import { postLogin, getMe, postChangePassword } from "./auth.controller";
import { requireAuth } from "../../middleware/requireAuth";

export const authRoutes = Router();

authRoutes.post("/login", postLogin);
authRoutes.get("/me", requireAuth, getMe);
authRoutes.post("/change-password", requireAuth, postChangePassword);

// Logout is client-side: the frontend discards the token. A server-side
// logout would need a token blocklist, which isn't worth it at this scale.
