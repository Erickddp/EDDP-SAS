import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";
import { PlanType } from "./saas-constants";
import { CONFIG } from "./env-config";

// In production, use a strong 32+ character secret from CONFIG
const secretKey = CONFIG.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: "user" | "guest" | "admin";
  avatarUrl?: string;
  googleAvatarUrl?: string | null;
  plan: PlanType;
  subscriptionStatus: "active" | "canceled" | "past_due" | "none";
  questionCount?: number; // Phase 8: Guest limit
}

export async function encrypt(payload: UserSession) {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}

export async function createSession(userSession: UserSession) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt(userSession);
  const cookieStore = await cookies();

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && !process.env.VERCEL_URL?.includes('localhost'),
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function updateSession() {
  const session = (await cookies()).get("session")?.value;
  const payload = await decrypt(session);

  if (!session || !payload) {
    return null;
  }

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && !process.env.VERCEL_URL?.includes('localhost'),
    expires: expires,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSession() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) return null;
    return await decrypt(sessionCookie);
}

export async function updateSessionData(data: Partial<UserSession>) {
    const current = await getSession();
    if (!current) return;
    
    const updated = { ...current, ...data };
    await createSession(updated);
}
