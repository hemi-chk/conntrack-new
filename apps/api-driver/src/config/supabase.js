require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// Use the Service Role Key to bypass RLS in the backend safely!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is missing in .env file');
}

if (!supabaseKey) {
    throw new Error('Supabase Key is missing in .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
