const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createProfile() {
    console.log('Attempting to create profile for Kasun...');
    
    const { data, error } = await supabase
        .from('profiles')
        .insert([
            { 
                first_name: 'Kasun', 
                last_name: 'Perera', 
                role: 'driver', 
                employee_id: '4' 
            }
        ])
        .select();

    if (error) {
        console.error('Error creating profile:', error.message);
    } else {
        console.log('Success! Profile created:', data);
    }
}

createProfile();
