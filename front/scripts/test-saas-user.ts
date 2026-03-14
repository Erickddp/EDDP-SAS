import "./load-env";
import { createUser, getUserByEmail } from "../lib/user-storage";

async function testUserCreation() {
    const testEmail = `test_${Date.now()}@example.com`;
    try {
        console.log(`Creating user with email: ${testEmail}...`);
        const user = await createUser({
            email: testEmail,
            name: "Test SaaS User",
            passwordHash: "dummy_hash",
            role: "user",
            avatarUrl: null
        });
        console.log("✅ User created:", user);

        console.log("Verifying persistence and SaaS auto-setup...");
        const verifiedUser = await getUserByEmail(testEmail);
        console.log("✅ Verified User:", verifiedUser);
        
        if (verifiedUser?.plan === "gratis" && verifiedUser?.subscriptionStatus === "active") {
            console.log("✨ SaaS Auto-Setup confirmed: Plan is 'gratis' and Status is 'active'.");
        } else {
            console.log("⚠️ SaaS Auto-Setup check failed.");
        }
    } catch (error) {
        console.error("❌ Test failed:", error);
    } finally {
        process.exit(0);
    }
}

testUserCreation();
