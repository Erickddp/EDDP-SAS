import "./load-env";
import { getClient } from "../lib/db";

async function check() {
  const client = await getClient();
  try {
    const countRes = await client.query(`SELECT count(*), abbreviation FROM legal_documents GROUP BY abbreviation`);
    console.log(`Counts by abbreviation:`);
    console.table(countRes.rows);

    const art1ccom = await client.query(`SELECT article_number, document_name, (embedding IS NOT NULL) as has_embedding FROM legal_documents WHERE abbreviation = 'CCOM' AND article_number = '1o'`);
    console.log(`CCOM Article 1o exists: ${art1ccom.rows.length > 0}`);
    if (art1ccom.rows.length > 0) {
      console.log(`CCOM Doc Name: ${art1ccom.rows[0].document_name}`);
      console.log(`CCOM Article 1o has embedding: ${art1ccom.rows[0].has_embedding}`);
    }

    const art1cff = await client.query(`SELECT article_number, document_name, (embedding IS NOT NULL) as has_embedding FROM legal_documents WHERE abbreviation = 'CFF' AND article_number = '1o'`);
    console.log(`CFF Article 1o exists: ${art1cff.rows.length > 0}`);
    if (art1cff.rows.length > 0) {
      console.log(`CFF Doc Name: ${art1cff.rows[0].document_name}`);
      console.log(`CFF Article 1o has embedding: ${art1cff.rows[0].has_embedding}`);
    }

    const dups = await client.query(`SELECT abbreviation, article_number, count(*) FROM legal_documents GROUP BY abbreviation, article_number HAVING count(*) > 1`);
    console.log(`Total duplicated (law, article) pairs: ${dups.rows.length}`);
    if (dups.rows.length > 0) {
        console.table(dups.rows);
    }

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}
check();
