import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { getClient } from "../lib/db";

async function check() {
  const client = await getClient();
  try {
    const countRes = await client.query(`SELECT count(*) FROM legal_documents WHERE abbreviation = 'CPEUM'`);
    console.log(`CPEUM total records: ${countRes.rows[0].count}`);

    const art1o = await client.query(`SELECT article_number, (embedding IS NOT NULL) as has_embedding FROM legal_documents WHERE abbreviation = 'CPEUM' AND article_number = '1o'`);
    console.log(`Article 1o exists: ${art1o.rows.length > 0}`);
    if (art1o.rows.length > 0) console.log(`Article 1o has embedding: ${art1o.rows[0].has_embedding}`);

    const art100lisr = await client.query(`SELECT article_number, (embedding IS NOT NULL) as has_embedding FROM legal_documents WHERE abbreviation = 'LISR' AND article_number = '100'`);
    console.log(`LISR Article 100 exists: ${art100lisr.rows.length > 0}`);
    if (art100lisr.rows.length > 0) console.log(`LISR Article 100 has embedding: ${art100lisr.rows[0].has_embedding}`);

    const dups = await client.query(`SELECT article_number, count(*) FROM legal_documents WHERE abbreviation = 'CPEUM' GROUP BY article_number HAVING count(*) > 1`);
    console.log(`Duplicates for CPEUM: ${dups.rows.length}`);

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}
check();
