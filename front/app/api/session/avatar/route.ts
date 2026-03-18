import { NextRequest, NextResponse } from "next/server";
import { decrypt, encrypt } from "@/lib/session";
import { isAllowedAvatar, resolveEffectiveAvatar, USER_AVATAR_OPTIONS } from "@/lib/avatar-options";

function applySessionCookie(response: NextResponse, token: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && !process.env.VERCEL_URL?.includes('localhost'),
    expires,
    sameSite: "lax",
    path: "/",
  });
}

export async function GET(request: NextRequest) {
  const rawSession = request.cookies.get("session")?.value;
  const session = await decrypt(rawSession);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const effectiveAvatarUrl = resolveEffectiveAvatar({
    avatarUrl: session.avatarUrl,
    googleAvatarUrl: session.googleAvatarUrl,
    seed: session.id,
  });

  if (session.avatarUrl !== effectiveAvatarUrl && !session.googleAvatarUrl) {
    const token = await encrypt({
      ...session,
      avatarUrl: effectiveAvatarUrl,
    });
    const response = NextResponse.json({
      avatarUrl: effectiveAvatarUrl,
      googleAvatarUrl: session.googleAvatarUrl ?? null,
      effectiveAvatarUrl,
      options: USER_AVATAR_OPTIONS,
      lockedByGoogle: Boolean(session.googleAvatarUrl),
    });
    applySessionCookie(response, token);
    return response;
  }

  return NextResponse.json({
    avatarUrl: session.avatarUrl ?? effectiveAvatarUrl,
    googleAvatarUrl: session.googleAvatarUrl ?? null,
    effectiveAvatarUrl,
    options: USER_AVATAR_OPTIONS,
    lockedByGoogle: Boolean(session.googleAvatarUrl),
    role: session.role,
    questionCount: session.questionCount ?? 0,
  });
}

export async function POST(request: NextRequest) {
  const rawSession = request.cookies.get("session")?.value;
  const session = await decrypt(rawSession);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { avatarUrl?: string };
  if (!body.avatarUrl || !isAllowedAvatar(body.avatarUrl)) {
    return NextResponse.json({ error: "Invalid avatar selection" }, { status: 400 });
  }

  const token = await encrypt({
    ...session,
    avatarUrl: body.avatarUrl,
  });

  const effectiveAvatarUrl = resolveEffectiveAvatar({
    avatarUrl: body.avatarUrl,
    googleAvatarUrl: session.googleAvatarUrl,
    seed: session.id,
  });

  const response = NextResponse.json({
    avatarUrl: body.avatarUrl,
    googleAvatarUrl: session.googleAvatarUrl ?? null,
    effectiveAvatarUrl,
    lockedByGoogle: Boolean(session.googleAvatarUrl),
  });

  applySessionCookie(response, token);
  return response;
}
