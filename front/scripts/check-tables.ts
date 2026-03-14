import "./load-env";
import { query } from "../lib/db";

async function checkTables() {
    try {
        const { rows } = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log("Current Tables in Database:");
        rows.forEach(r => console.log(`- ${r.table_name}`));
    } catch (error) {
        console.error("Error checking tables:", error);
    } finally {
        process.exit(0);
    }
}

checkTables();
