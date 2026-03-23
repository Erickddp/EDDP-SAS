import { NextRequest, NextResponse } from "next/server";
import { decrypt, encrypt } from "@/lib/session";
import { isAllowedAvatar, resolveEffectiveAvatar, USER_AVATAR_OPTIONS } from "@/lib/avatar-options";
import { updateUserProfile, getUserPreferences, updateUserPreferences } from "@/lib/user-storage";

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

  const preferences = await getUserPreferences(session.id);

  const effectiveAvatarUrl = resolveEffectiveAvatar({
    avatarUrl: session.avatarUrl,
    googleAvatarUrl: session.googleAvatarUrl,
    seed: session.id,
  });

  const responseData = {
    avatarUrl: session.avatarUrl ?? effectiveAvatarUrl,
    googleAvatarUrl: session.googleAvatarUrl ?? null,
    effectiveAvatarUrl,
    options: USER_AVATAR_OPTIONS,
    lockedByGoogle: Boolean(session.googleAvatarUrl),
    role: session.role,
    questionCount: session.questionCount ?? 0,
    professionalProfile: session.professionalProfile ?? null,
    name: session.name ?? null,
    // Personalization fields
    preferences: preferences || {
        expertiseLevel: 'principiante',
        preferredTone: 'explicativo',
        industryContext: null,
        additionalContext: null,
        isProfileComplete: false
    }
  };

  if (session.avatarUrl !== effectiveAvatarUrl && !session.googleAvatarUrl) {
    const token = await encrypt({
      ...session,
      avatarUrl: effectiveAvatarUrl,
    });
    const response = NextResponse.json(responseData);
    applySessionCookie(response, token);
    return response;
  }

  return NextResponse.json(responseData);
}

export async function POST(request: NextRequest) {
  const rawSession = request.cookies.get("session")?.value;
  const session = await decrypt(rawSession);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { 
    avatarUrl?: string; 
    name?: string; 
    professionalProfile?: string;
    // New personalization fields
    expertiseLevel?: string;
    preferredTone?: string;
    industryContext?: string | null;
    additionalContext?: string | null;
  };
  
  if (body.avatarUrl && !isAllowedAvatar(body.avatarUrl)) {
    return NextResponse.json({ error: "Invalid avatar selection" }, { status: 400 });
  }

  try {
    let updateSessionRequired = false;
    let newSessionData = { ...session };

    // 1. Update Core Profile (Identity)
    if ((body.name !== undefined || body.professionalProfile !== undefined) && session.role !== "guest") {
        await updateUserProfile(session.id, { 
            name: body.name, 
            professionalProfile: body.professionalProfile 
        });
        newSessionData.name = body.name !== undefined ? body.name : session.name;
        newSessionData.professionalProfile = body.professionalProfile !== undefined ? body.professionalProfile : session.professionalProfile;
        updateSessionRequired = true;
    }

    // 2. Update Personalization Preferences
    const hasPrefUpdates = body.expertiseLevel !== undefined || 
                          body.preferredTone !== undefined || 
                          body.industryContext !== undefined || 
                          body.additionalContext !== undefined;

    if (hasPrefUpdates && session.role !== "guest") {
        const currentPrefs = await getUserPreferences(session.id);
        
        const newPrefs = {
            expertiseLevel: body.expertiseLevel ?? currentPrefs?.expertiseLevel ?? 'principiante',
            preferredTone: body.preferredTone ?? currentPrefs?.preferredTone ?? 'explicativo',
            industryContext: body.industryContext !== undefined ? body.industryContext : (currentPrefs?.industryContext ?? null),
            additionalContext: body.additionalContext !== undefined ? body.additionalContext : (currentPrefs?.additionalContext ?? null),
        };

        // Logic check for isProfileComplete
        const isProfileComplete = Boolean(
            newPrefs.expertiseLevel && 
            newPrefs.preferredTone && 
            newPrefs.industryContext &&
            (body.professionalProfile || session.professionalProfile)
        );

        await updateUserPreferences(session.id, {
            ...newPrefs,
            isProfileComplete
        });

        if (isProfileComplete !== session.isProfileComplete) {
            newSessionData.isProfileComplete = isProfileComplete;
            updateSessionRequired = true;
        }
    }

    if (body.avatarUrl !== undefined && body.avatarUrl !== session.avatarUrl) {
        newSessionData.avatarUrl = body.avatarUrl;
        updateSessionRequired = true;
    }

    const response = NextResponse.json({ success: true });

    if (updateSessionRequired) {
        const token = await encrypt(newSessionData);
        applySessionCookie(response, token);
    }

    return response;
  } catch (error: any) {
    console.error("[PROFILE UPDATE] Error:", error.message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
