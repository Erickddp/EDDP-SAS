import { searchArticles } from "../lib/vector-search";
import { parseLegalReference } from "../lib/law-alias";
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function test() {
  const queries = [
    "art 1 cpeum",
    "art 100 lisr",
    "por que debo pagar impuestos"
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
