import "./load-env";
import { searchArticles } from "../lib/vector-search";
import { parseLegalReference } from "../lib/law-alias";

async function test() {
  const queries = [
    "art 1 cpeum",
    "art 100 lisr",
    "art 1 cccom",
    "art 1 ccom",
    "quienes son los comerciantes",
    "las personas fisicas y morales estan obligadas a contribuir",
    "actos de comercio segun el codigo de comercio"
  ];

  for (const q of queries) {
    console.log(`\n--- TEST QUERY: "${q}" ---`);
    const parsedRef = parseLegalReference(q);
    const results = await searchArticles(q, 3, parsedRef);
    
    if (results.length > 0) {
      const top = results[0];
      console.log(`Strategy: ${parsedRef.lawAbbreviation ? 'exact-match-filters' : 'pure-vector'}`);
      console.log(`Top Result: ${top.documentAbbreviation} Art. ${top.articleNumber}`);
      console.log(`Similarity: ${top.similarity?.toFixed(4)}`);
      console.log(`Content Sample: ${top.text.substring(0, 100)}...`);
    } else {
      console.log("No results found.");
    }
  }
  process.exit(0);
}

test();
