
async function testPhase7C() {
    console.log("Testing Phase 7C: Deductive Reasoning & Persona...");
    
    const payload = {
        message: "¿Qué pasa si no presento una declaración mensual?",
        conversationId: "test-7c-" + Date.now(),
        mode: "casual",
        detailLevel: "detailed",
        history: []
    };

    try {
        const response = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-test-secret": "myfiscal-test-pass"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const answer = data.answer;

        console.log("\n--- RESPONSE ANALYSIS ---");
        console.log("Summary:", answer.summary);
        
        console.log("\n--- DEDUCTIVE FIELDS ---");
        console.log("Deductive Insight:", answer.deductiveInsight || "MISSING");
        console.log("Proactive Question:", answer.proactiveQuestion || "MISSING");
        
        if (answer.deductiveInsight && answer.proactiveQuestion) {
            console.log("\n✅ SUCCESS: Deductive fields populated.");
            console.log("Insight Sample:", answer.deductiveInsight.substring(0, 100) + "...");
        } else {
            console.log("\n❌ FAILURE: Missing deductive fields.");
        }

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testPhase7C();
