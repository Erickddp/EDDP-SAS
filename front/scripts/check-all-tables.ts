import "./load-env";
import { query } from "../lib/db";

async function checkAllTables() {
    try {
        const { rows } = await query(`
            SELECT schemaname, tablename 
            FROM pg_catalog.pg_tables 
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY schemaname, tablename;
        `);
        console.log("All Tables in Database:");
        rows.forEach(r => console.log(`- ${r.schemaname}.${r.tablename}`));
    } catch (error) {
        console.error("Error checking tables:", error);
    } finally {
        process.exit(0);
    }
}

checkAllTables();
