import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { prisma } from "../../db/prisma";
import { env } from "../../config/env";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

/**
 * Verifies credentials and issues a JWT.
 * Returns null for both "no such user" and "wrong password" on purpose —
 * distinguishing them lets an attacker enumerate valid usernames.
 */
export async function login(username: string, password: string): Promise<LoginResult | null> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  const payload: AuthUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
  expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"], });
  return { token, user: payload };
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return { id: user.id, username: user.username, name: user.name, role: user.role };
}

export async function changePassword(
  id: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return false;
  if (!(await bcrypt.compare(currentPassword, user.password))) return false;

  await prisma.user.update({
    where: { id },
    data: { password: await bcrypt.hash(newPassword, 10) },
  });
  return true;
}
