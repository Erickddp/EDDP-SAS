import { analyzeQueryWithDebug } from "../lib/query-analyzer";

const queries = [
    { m: "¿Cuál es la multa por no presentar declaración mensual?", mode: "casual", detail: "detallada" },
    { m: "¿Qué actos están gravados con IVA?", mode: "casual", detail: "detallada" },
    { m: "Dime el artículo 27 del CFF", mode: "casual", detail: "sencilla" }
];

queries.forEach(q => {
    console.log(`\nTesting Query: "${q.m}"`);
    const { analysis, debug } = analyzeQueryWithDebug(q.m, q.mode as any, q.detail as any);
    console.log(`Intent: ${analysis.detectedIntent}`);
    console.log(`Structured Intent: ${JSON.stringify(analysis.structuredIntent, null, 2)}`);
});
