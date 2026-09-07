import bcrypt from 'bcryptjs';
import { supabase } from '../../../packages/api-core/src/supabase.js';

async function resetDriverPassword() {
    const [, , target, temporaryPassword] = process.argv;

    if (!target || !temporaryPassword) {
        console.error('Usage: npm run reset-driver-password -- <driver_id|all> <temporary_password>');
        process.exit(1);
    }

    if (temporaryPassword.length < 6) {
        console.error('Temporary password must be at least 6 characters.');
        process.exit(1);
    }

    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    let query = supabase.from('drivers').update({ password_hash: passwordHash, updated_at: new Date() });

    if (target === 'all' || target === '--all') {
        const { data, error } = await supabase
            .from('drivers')
            .update({ password_hash: passwordHash, updated_at: new Date() })
            .not('driver_id', 'is', null)
            .select('driver_id, emp_id, driver_reference');

        if (error) {
            console.error('Failed to reset all driver passwords:', error.message);
            process.exit(1);
        }

        console.log('Temporary password set successfully for all drivers.');
        console.log(`Updated ${data.length} driver(s).`);
        console.log(`Temporary password: ${temporaryPassword}`);
        console.log('Ask each driver to change their password after login.');
        return;
    }

    const numericId = Number(target);
    if (!Number.isNaN(numericId) && Number.isInteger(numericId)) {
        query = query.eq('driver_id', numericId);
    } else {
        query = query.eq('driver_reference', target);
    }

    const { data, error } = await query.select('driver_id, emp_id, driver_reference').single();

    if (error) {
        console.error('Failed to reset password:', error.message);
        process.exit(1);
    }

    console.log('Temporary password set successfully.');
    console.log(`Driver ID: ${data.driver_id}`);
    console.log(`Employee ID: ${data.emp_id || 'N/A'}`);
    console.log(`Driver Reference: ${data.driver_reference || 'N/A'}`);
    console.log(`Temporary password: ${temporaryPassword}`);
    console.log('Give the temporary password to the driver and ask them to change it after login.');
}

resetDriverPassword().catch((error) => {
    console.error('Unexpected error:', error.message);
    process.exit(1);
});
