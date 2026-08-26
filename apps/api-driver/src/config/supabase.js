require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
// Use the Service Role Key to bypass RLS in the backend safely!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
