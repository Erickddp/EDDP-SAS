import { NextRequest, NextResponse } from "next/server";
import { decrypt, encrypt } from "@/lib/session";
import { isAllowedAvatar, resolveEffectiveAvatar, USER_AVATAR_OPTIONS } from "@/lib/avatar-options";
import { updateUserProfile } from "@/lib/user-storage";

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
      role: session.role,
      questionCount: session.questionCount ?? 0,
      professionalProfile: session.professionalProfile ?? null,
      name: session.name ?? null,
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
    professionalProfile: session.professionalProfile ?? null,
    name: session.name ?? null,
  });
}

export async function POST(request: NextRequest) {
  const rawSession = request.cookies.get("session")?.value;
  const session = await decrypt(rawSession);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { avatarUrl?: string; name?: string; professionalProfile?: string };
  
  if (body.avatarUrl && !isAllowedAvatar(body.avatarUrl)) {
    return NextResponse.json({ error: "Invalid avatar selection" }, { status: 400 });
  }

  try {
    // If the user is trying to update name or professionalProfile and is not a guest
    if ((body.name !== undefined || body.professionalProfile !== undefined) && session.role !== "guest") {
        await updateUserProfile(session.id, { 
            name: body.name, 
            professionalProfile: body.professionalProfile 
        });
    }

    const token = await encrypt({
        ...session,
        avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : session.avatarUrl,
        name: body.name !== undefined ? body.name : session.name,
        professionalProfile: body.professionalProfile !== undefined ? body.professionalProfile : session.professionalProfile,
    });

    const effectiveAvatarUrl = resolveEffectiveAvatar({
        avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : session.avatarUrl,
        googleAvatarUrl: session.googleAvatarUrl,
        seed: session.id,
    });

    let isSuccessResponse = body.name !== undefined || body.professionalProfile !== undefined;
    const response = NextResponse.json(isSuccessResponse ? { success: true } : {
        avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : session.avatarUrl,
        googleAvatarUrl: session.googleAvatarUrl ?? null,
        effectiveAvatarUrl,
        lockedByGoogle: Boolean(session.googleAvatarUrl),
        role: session.role,
        questionCount: session.questionCount ?? 0,
        professionalProfile: body.professionalProfile !== undefined ? body.professionalProfile : session.professionalProfile,
        name: body.name !== undefined ? body.name : session.name,
    });

    applySessionCookie(response, token);
    return response;
  } catch (error: any) {
    console.error("[PROFILE UPDATE] Error:", error.message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
