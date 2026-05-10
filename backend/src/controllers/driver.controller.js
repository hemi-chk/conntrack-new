const supabase = require('../config/supabase'); // Assuming you have a supabase config
const bcrypt = require('bcrypt');

// 1. Get all orders assigned to a specific driver
exports.getAssignedOrders = async (req, res) => {
    try {
        const { driverId } = req.params;

        const { data, error } = await supabase
            .from('order_assignments')
            .select(`
                assignment_id,
                status,
                assigned_at,
                orders (
                    order_id,
                    order_reference,
                    order_type,
                    cargo_type,
                    cargo_weight,
                    pickup_country,
                    pickup_state,
                    destination_country,
                    destination_state,
                    special_instructions,
                    current_status
                )
            `)
            .eq('driver_id', driverId)
            .eq('status', 'assigned');

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Update live GPS tracking for a container
exports.updateTracking = async (req, res) => {
    try {
        const { orderId, driverId, latitude, longitude, status, description } = req.body;

        const { data, error } = await supabase
            .from('container_tracking')
            .insert([
                {
                    order_id: orderId,
                    driver_id: driverId,
                    latitude,
                    longitude,
                    status,
                    description,
                    recorded_at: new Date()
                }
            ]);

        if (error) throw error;

        // Also update the main order status if needed
        if (status) {
            await supabase
                .from('orders')
                .update({ current_status: status })
                .eq('order_id', orderId);
        }

        res.status(200).json({ success: true, message: 'Tracking updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Get Driver Profile and Documents
exports.getDriverDetails = async (req, res) => {
    try {
        const { driverId } = req.params;

        const { data, error } = await supabase
            .from('drivers')
            .select(`
                *,
                profiles (
                    first_name,
                    last_name,
                    contact_number,
                    address
                ),
                documents (*)
            `)
            .eq('driver_id', driverId)
            .single();

        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Login Driver (Verify Driver ID and Password)
exports.loginDriver = async (req, res) => {
    try {
        const { driverId, password } = req.body;
        
        if (!driverId || !password) {
            return res.status(400).json({ success: false, message: 'Missing Driver ID or password' });
        }

        const isNumeric = /^\d+$/.test(driverId);

        console.log('--- Login Attempt ---');
        console.log('Trying to log in with ID:', driverId);

        let query = supabase.from('drivers').select('*');

        if (isNumeric) {
            query = query.or(`driver_id.eq.${driverId},emp_id.eq.${driverId},driver_reference.eq.${driverId}`);
        } else {
            query = query.or(`emp_id.eq.${driverId},driver_reference.eq.${driverId}`);
        }

        const { data, error } = await query.maybeSingle();

        if (!data) {
            console.log('No Match Found in Drivers Table');
            return res.status(401).json({ success: false, message: 'Invalid Driver ID' });
        }

        // Verify Password
        // If password_hash is not set (legacy or unassigned), we handle it
        if (!data.password_hash) {
            // For now, if no password is set in DB, we allow login with any password OR a default '1234'
            // In production, you would force an initial password setup or check a default.
            // Let's assume for this transition phase, we log them in and warn.
            console.log('User has no password set in DB. Allowing entry for setup.');
        } else {
            const isMatch = await bcrypt.compare(password, data.password_hash);
            if (!isMatch) {
                console.log('Password Mismatch');
                return res.status(401).json({ success: false, message: 'Invalid password' });
            }
        }

        console.log('Match Found:', data.first_name, data.last_name);

        // Fetch associated vehicle details
        const { data: vehicleData } = await supabase
            .from('vehicles')
            .select('*')
            .eq('supplier_id', data.supplier_id)
            .limit(1)
            .single();

        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                ...data,
                vehicle: vehicleData || null
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * 4.5 Change Driver Password
 * Securely updates the driver's password after verifying the old one.
 */
exports.changePassword = async (req, res) => {
    try {
        const { driverId, oldPassword, newPassword } = req.body;

        if (!driverId || !oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // 1. Fetch the driver's current password hash
        const { data, error } = await supabase
            .from('drivers')
            .select('password_hash')
            .eq('driver_id', driverId)
            .single();

        if (error || !data) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        // 2. Verify Old Password (if one exists)
        if (data.password_hash) {
            const isMatch = await bcrypt.compare(oldPassword, data.password_hash);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Current password incorrect' });
            }
        }

        // 3. Hash New Password
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // 4. Update Database
        const { error: updateError } = await supabase
            .from('drivers')
            .update({
                password_hash: hashedNewPassword,
                updated_at: new Date()
            })
            .eq('driver_id', driverId);

        if (updateError) throw updateError;

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * 5. Get Active Mission for Driver
 */
exports.getActiveMission = async (req, res) => {
    try {
        const { driverId } = req.params; // This is now a number (e.g., "4")
        const internalId = parseInt(driverId);

        console.log('--- Mission Scan ---');
        console.log('Searching assignments for Driver ID:', internalId);

        // Find the active assignment using the Number ID directly
        const { data, error } = await supabase
            .from('order_assignments')
            .select(`
                *,
                orders (
                    *
                )
            `)
            .eq('driver_id', internalId)
            .neq('status', 'completed')
            .neq('status', 'delivered')
            .order('assigned_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.log('Database Error:', error.message);
            return res.status(200).json({ success: true, data: null, message: 'No active mission found' });
        }

        // 🟢 NEW: Fetch the latest journey progress from the history table
        const { data: latestHistory } = await supabase
            .from('order_tracking_history')
            .select('stage_name')
            .eq('assignment_id', data.assignment_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // If history exists, use that as the "current status" for the UI timeline
        if (latestHistory) {
            data.status = latestHistory.stage_name;
        }

        console.log('Found Mission:', data?.orders?.order_reference);
        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Fetch Mission Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * 6. Update Mission Status (Complete Stage)
 */
exports.updateMissionStatus = async (req, res) => {
    try {
        const { assignmentId, orderId, status, locationName, latitude, longitude } = req.body;
        console.log('--- DB Update Start ---');
        console.log('Assignment ID:', assignmentId, 'New Status:', status);

        console.log('--- DB Update Start ---');
        console.log('Assignment ID:', assignmentId, 'New Status:', status);

        // 1. Only update the high-level assignment status if it's a core milestone
        const coreStatuses = ['assigned', 'started', 'picked', 'transit', 'delivered', 'completed'];
        if (coreStatuses.includes(status.toLowerCase())) {
            console.log('Updating core assignment status to:', status);
            const { error: assignmentError } = await supabase
                .from('order_assignments')
                .update({ status: status })
                .eq('assignment_id', assignmentId);

            if (assignmentError) {
                console.error('Step 1 (Assignment) Failed:', assignmentError.message);
                throw assignmentError;
            }
        } else {
            console.log('Skipping order_assignments update for intermediate stage:', status);
        }

        // 2. Add a detailed record to the new order_tracking_history table
        console.log('Recording journey milestone in order_tracking_history...');
        const { error: historyError } = await supabase
            .from('order_tracking_history')
            .insert([{
                order_id: orderId,
                assignment_id: assignmentId,
                stage_name: status,
                location_name: locationName,
                latitude: latitude,
                longitude: longitude,
                created_at: new Date()
            }]);

        if (historyError) {
            console.error('Step 2 (History) Failed:', historyError.message);
            throw historyError;
        }

        console.log('--- DB Update Complete ---');
        res.status(200).json({ success: true, message: 'Status tracked successfully' });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
};

/**
 * 7. Upload Document (Photo)
 */
exports.uploadDocument = async (req, res) => {
    try {
        const { orderId, driverId, documentType, base64Image } = req.body;

        if (!base64Image) {
            return res.status(400).json({ success: false, message: 'No image data provided' });
        }

        // 1. Convert Base64 to Buffer
        const buffer = Buffer.from(base64Image, 'base64');
        const filePath = `${orderId}/${documentType}_${Date.now()}.jpg`;

        // 2. Upload to Supabase Storage (Assumes 'documents' bucket exists)
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('documents')
            .upload(filePath, buffer, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (uploadError) {
            console.error('Storage Error:', uploadError);
            return res.status(500).json({ success: false, message: 'Failed to upload to storage' });
        }

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('documents')
            .getPublicUrl(filePath);

        // 4. Save metadata to database (Assumes 'documents' table exists)
        const { error: dbError } = await supabase
            .from('documents')
            .insert([{
                order_id: orderId,
                driver_id: driverId,
                document_type: documentType,
                file_url: publicUrl,
                status: 'pending'
            }]);

        if (dbError) {
            console.error('DB Error:', dbError);
            // Even if DB fails, we have the file, but we should probably inform the user
        }

        res.status(200).json({
            success: true,
            message: 'Document uploaded successfully',
            url: publicUrl
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * 8. Update Driver Duty Status (Active/Inactive)
 */
exports.updateDutyStatus = async (req, res) => {
    try {
        const { driverId, active } = req.body;
        const statusValue = active ? 'active' : 'inactive';

        console.log(`Updating Duty Status for Driver ${driverId} to: ${statusValue}`);

        const { error } = await supabase
            .from('drivers')
            .update({
                status: statusValue,
                updated_at: new Date()
            })
            .eq('driver_id', driverId);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: `Duty status updated to ${statusValue}`
        });
    } catch (error) {
        console.error('Duty Status Update Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update duty status' });
    }
};

/**
 * 9. Update Driver Profile
 */
exports.updateProfile = async (req, res) => {
    try {
        const { driverId, first_name, last_name, contact_number, empId } = req.body;

        console.log('--- Profile Update Attempt ---');
        console.log('Received Body:', JSON.stringify(req.body, null, 2));

        const targetId = driverId || empId;

        if (!targetId) {
            return res.status(400).json({ success: false, message: 'Missing Driver ID or Employee ID' });
        }

        const { error } = await supabase
            .from('drivers')
            .update({
                first_name,
                last_name,
                contact_number,
                updated_at: new Date()
            })
            .or(`driver_id.eq.${targetId},emp_id.eq.${targetId}`);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Profile Update Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
};

/**
 * 10. Get Issues for a Driver
 */
exports.getDriverIssues = async (req, res) => {
    try {
        const { driverId } = req.params;
        const internalId = parseInt(driverId);

        console.log('--- Fetching Issues for Driver:', internalId, '---');

        const { data, error } = await supabase
            .from('issues')
            .select(`
                *,
                orders (
                    order_reference,
                    order_type
                )
            `)
            .eq('driver_id', internalId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Fetch Issues Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch issues' });
    }
};

/**
 * 11. Report a New Issue
 */
exports.reportIssue = async (req, res) => {
    try {
        const { driverId, orderId, supplierId, issueType, priority, description } = req.body;

        console.log('--- New Issue Report ---');
        console.log('Driver:', driverId, '| Type:', issueType, '| Priority:', priority);

        if (!driverId || !issueType || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: driverId, issueType, description'
            });
        }

        const { data, error } = await supabase
            .from('issues')
            .insert([{
                driver_id: parseInt(driverId),
                order_id: orderId ? parseInt(orderId) : null,
                supplier_id: supplierId ? parseInt(supplierId) : null,
                reported_by: null,
                issue_type: issueType,
                priority: priority || 'medium',
                description: description,
                status: 'open',
                created_at: new Date(),
                updated_at: new Date()
            }])
            .select();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Issue reported successfully',
            data: data?.[0] || null
        });
    } catch (error) {
        console.error('Report Issue Error:', error);
        res.status(500).json({ success: false, message: 'Failed to report issue' });
    }
};

/**
 * 12. Upload Profile Photo
 */
exports.uploadProfilePhoto = async (req, res) => {
    try {
        const { driverId, base64Image } = req.body;

        console.log('--- Profile Photo Upload ---');
        console.log('Driver ID:', driverId);

        if (!driverId || !base64Image) {
            return res.status(400).json({ success: false, message: 'Missing driverId or image data' });
        }

        // 1. Convert Base64 to Buffer
        const buffer = Buffer.from(base64Image, 'base64');
        const filePath = `driver_${driverId}/profile_${Date.now()}.jpg`;

        // 2. Upload to Supabase Storage ('documents' bucket)
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('documents')
            .upload(filePath, buffer, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (uploadError) {
            console.error('Storage Upload Error:', uploadError);
            return res.status(500).json({ success: false, message: 'Failed to upload photo to storage' });
        }

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('documents')
            .getPublicUrl(filePath);

        console.log('Photo uploaded, Public URL:', publicUrl);

        // 4. Update the driver's profile_photo_url in the database
        const { error: dbError } = await supabase
            .from('drivers')
            .update({
                profile_photo_url: publicUrl,
                updated_at: new Date()
            })
            .eq('driver_id', parseInt(driverId));

        if (dbError) {
            console.error('DB Update Error:', dbError);
            return res.status(500).json({ success: false, message: 'Photo uploaded but failed to save URL' });
        }

        res.status(200).json({
            success: true,
            message: 'Profile photo updated successfully',
            url: publicUrl
        });
    } catch (error) {
        console.error('Profile Photo Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * 13. Remove Profile Photo
 */
exports.removeProfilePhoto = async (req, res) => {
    try {
        const { driverId } = req.body;

        if (!driverId) {
            return res.status(400).json({ success: false, message: 'Missing driverId' });
        }

        const { error: dbError } = await supabase
            .from('drivers')
            .update({
                profile_photo_url: null,
                updated_at: new Date()
            })
            .eq('driver_id', parseInt(driverId));

        if (dbError) {
            console.error('DB Update Error:', dbError);
            return res.status(500).json({ success: false, message: 'Failed to remove profile photo' });
        }

        res.status(200).json({
            success: true,
            message: 'Profile photo removed successfully'
        });
    } catch (error) {
        console.error('Remove Profile Photo Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * 14. Get Trip History for Driver
 */
exports.getDriverHistory = async (req, res) => {
    try {
        const { driverId } = req.params;

        const { data, error } = await supabase
            .from('order_assignments')
            .select(`
                assignment_id,
                status,
                assigned_at,
                orders (
                    order_id,
                    order_reference,
                    order_type,
                    pickup_country,
                    pickup_state,
                    destination_country,
                    destination_state
                )
            `)
            .eq('driver_id', driverId)
            .in('status', ['delivered', 'completed'])
            .order('assigned_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('History Fetch Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 15. Get Vehicle Info by Supplier ID
 */
exports.getVehicleInfo = async (req, res) => {
    try {
        const { supplierId } = req.params;

        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('supplier_id', supplierId)
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Vehicle Fetch Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 16. Get Documents for a specific Order
 */
exports.getOrderDocuments = async (req, res) => {
    try {
        const { orderId } = req.params;

        const { data, error } = await supabase
            .from('clearance_documents')
            .select(`
                *,
                orders (
                    order_reference
                )
            `)
            .eq('order_id', orderId);

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Documents Fetch Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 19. Get Tracking Stages
 * Fetches the dynamic journey milestones for a specific order type.
 */
exports.getTrackingStages = async (req, res) => {
    try {
        const { type } = req.params; // 'import' or 'export'
        console.log(`--- Stage Fetch Start ---`);
        console.log(`Requesting stages for type: "${type}"`);

        const { data, error } = await supabase
            .from('tracking_stages')
            .select('*')
            .ilike('order_type', `%${type.trim()}%`)
            .order('sequence_order', { ascending: true });

        if (error) {
            console.error('DB Error fetching stages:', error.message);
            throw error;
        }

        console.log(`Successfully found ${data?.length || 0} stages for ${type}`);
        console.log(`--- Stage Fetch Complete ---`);

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Fetch Stages Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tracking stages' });
    }
};

/**
 * 20. Get Assigned Vehicle
 * Fetches vehicle details based on the driver's active assignment.
 */
exports.getAssignedVehicle = async (req, res) => {
    try {
        const { driverId } = req.params;

        // 1. Find the active assignment to get the vehicle_id
        const { data: assignment, error: assignError } = await supabase
            .from('order_assignments')
            .select(`
                vehicle_id,
                vehicles (
                    *
                )
            `)
            .eq('driver_id', driverId)
            .neq('status', 'completed')
            .neq('status', 'delivered')
            .order('assigned_at', { ascending: false })
            .limit(1)
            .single();

        if (assignError || !assignment) {
            return res.status(200).json({ success: true, data: null, message: 'No active vehicle assignment found' });
        }

        res.status(200).json({
            success: true,
            data: assignment.vehicles
        });
    } catch (error) {
        console.error('Fetch Assigned Vehicle Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
