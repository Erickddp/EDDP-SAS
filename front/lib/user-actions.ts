"use server";

import { getSession, updateSessionData } from "./session";
import { updateUserProfile } from "./user-storage";
import { revalidatePath } from "next/cache";

export async function updateProfessionalProfile(profile: "entrepreneur" | "accountant" | "lawyer") {
    const session = await getSession();
    
    if (!session || !session.id) {
        throw new Error("No autorizado");
    }

    try {
        // 1. Update Database
        await updateUserProfile(session.id, { professionalProfile: profile });

        // 2. Update Session/Cookie
        await updateSessionData({ professionalProfile: profile });

        // 3. Revalidate path to refresh UI
        revalidatePath("/account");
        revalidatePath("/chat");

        return { success: true };
    } catch (error) {
        console.error("Failed to update profile:", error);
        return { success: false, error: "Error al actualizar el perfil" };
    }
}
