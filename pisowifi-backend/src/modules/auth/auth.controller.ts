import type { Request, Response, NextFunction } from "express";
import { login, getUserById, changePassword } from "./auth.service";

export async function postLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const result = await login(String(username), String(password));
    if (!result) {
      return res.status(401).json({ error: "Incorrect username or password" });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** Lets the frontend restore a session on page reload without a fresh login. */
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getUserById(req.user!.id);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function postChangePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body ?? {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both passwords are required" });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    const ok = await changePassword(req.user!.id, String(currentPassword), String(newPassword));
    if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
