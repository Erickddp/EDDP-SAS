import { searchNormalizedArticles } from "../lib/normalized-retrieval";

const queries = [
    "¿Cuál es la multa por no presentar declaración mensual?",
    "¿Qué actos están gravados con IVA?",
    "¿Cómo se calculan los recargos?"
];

queries.forEach(q => {
    console.log(`\nTesting Retrieval for: "${q}"`);
    const results = searchNormalizedArticles(q, 5);
    console.log(`Results: ${results.length}`);
    results.forEach(r => console.log(` - ${r.documentAbbreviation} Art. ${r.articleNumber}`));
});
