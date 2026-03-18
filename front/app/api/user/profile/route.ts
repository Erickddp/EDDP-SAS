import { NextResponse } from "next/server";
import { getSession, updateSessionData } from "@/lib/session";
import { updateUserProfile } from "@/lib/user-storage";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role === "guest") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { name, professionalProfile } = await req.json();

        if (!name && !professionalProfile) {
            return NextResponse.json({ error: "Datos faltantes" }, { status: 400 });
        }

        await updateUserProfile(session.id, { name, professionalProfile });
        
        // Update session cookie
        await updateSessionData({ 
            name: name || session.name, 
            professionalProfile: professionalProfile || session.professionalProfile 
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[PROFILE UPDATE] Error:", error.message);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
