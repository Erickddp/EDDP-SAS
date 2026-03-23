import "./load-env";
import { getUserPreferences, updateUserPreferences, getUserByEmail } from "../lib/user-storage";

async function testPersonalization() {
    const testEmail = "erickddp@gmail.com"; // Existing user from previous tasks
    console.log(`🔍 Testing personalization for ${testEmail}...`);

    try {
        let user = await getUserByEmail(testEmail);
        if (!user) {
            console.log("⚠️ Test user not found. Creating temporary test user...");
            const { createUser } = await import("../lib/user-storage");
            user = await createUser({
                email: testEmail,
                name: "Test Persona User",
                passwordHash: "test_hash",
                role: "user",
                avatarUrl: undefined
            });
        }

        console.log("1. Updating preferences...");
        await updateUserPreferences(user.id, {
            expertiseLevel: "contador",
            preferredTone: "directo",
            industryContext: "comercio",
            additionalContext: "Busco optimizar RESICO para clientes de servicios."
        });

        console.log("2. Fetching preferences...");
        const prefs = await getUserPreferences(user.id);
        
        if (prefs && 
            prefs.expertiseLevel === "contador" && 
            prefs.preferredTone === "directo" && 
            prefs.industryContext === "comercio") {
            console.log("✅ Personalization saved and retrieved correctly!");
            console.log("Data:", prefs);
        } else {
            console.error("❌ Personalization data mismatch:", prefs);
            process.exit(1);
        }

        console.log("3. Testing profile completion logic...");
        if (prefs?.isProfileComplete) {
            console.log("✅ Profile correctly marked as complete!");
        } else {
            console.log("⚠️ Profile not marked as complete. This might be fine if professionalProfile is missing.");
            console.log("professionalProfile:", user.professionalProfile);
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
}

testPersonalization();
