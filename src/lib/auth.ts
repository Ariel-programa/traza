import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Rol } from "@prisma/client";

const SESSION_COOKIE = "traza_session";
const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "traza-dev-secret-change-in-production"
);

export type SessionPayload = {
  userId: string;
  email: string;
  rol: Rol;
  nombre: string;
  empresaId: string | null;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    const session = payload as unknown as SessionPayload;
    // Revalidar contra la base: un usuario desactivado no debe poder seguir
    // usando una sesión ya emitida hasta que el JWT expire por su cuenta.
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { activo: true } });
    if (!user || !user.activo) return null;
    return session;
  } catch {
    return null;
  }
});

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    include: { empresa: true },
  });
}
