import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local first (common for Supabase/dev variables)
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
// Then fallback to .env
dotenv.config({ path: path.join(process.cwd(), '.env') });
