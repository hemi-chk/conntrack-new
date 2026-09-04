const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Expo } = require('expo-server-sdk');
const DRIVER_STATUS_TO_OPERATION_STATUS = {
    assigned: 'driver_assigned',
    started: 'driver_assigned',
    'heading to pickup': 'driver_assigned',
    picked: 'in_transit',
    'picked up': 'in_transit',
    transit: 'in_transit',
    'in transit': 'in_transit',
    delivered: 'completed',
    completed: 'completed'
};
const getTrackingStatus = (status) => {
    const normalizedStatus = String(status || '').trim().toLowerCase();
    return DRIVER_STATUS_TO_OPERATION_STATUS[normalizedStatus] || null;
};

const getCurrentLocation = (description, latitude, longitude) => {
    const readableDescription = String(description || '').trim();
    if (readableDescription && readableDescription.toLowerCase() !== 'live gps update') {
        return readableDescription;
    }

    return `GPS: ${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}`;
};

exports.getAssignedOrders = async (req, res) => {
    try {
        const driverId = req.driver.driver_id;

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
                    pickup_country:pickup_district,
                    pickup_state:pickup_location,
                    destination_country:destination_district,
                    destination_state:destination_location,
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
        const { orderId, assignmentId, latitude, longitude, status, description } = req.body;
        const driverId = req.driver.driver_id;

        if (!driverId || !orderId || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
            return res.status(400).json({ success: false, message: 'Missing or invalid tracking data' });
        }

        if (Number(latitude) < -90 || Number(latitude) > 90 || Number(longitude) < -180 || Number(longitude) > 180) {
            return res.status(400).json({ success: false, message: 'Coordinates are out of range' });
        }

        if (assignmentId) {
            const { data: assignment, error: assignmentError } = await supabase
                .from('order_assignments')
                .select('assignment_id')
                .eq('assignment_id', assignmentId)
                .eq('order_id', orderId)
                .eq('driver_id', driverId)
                .neq('status', 'completed')
                .neq('status', 'delivered')
                .maybeSingle();

            if (assignmentError) throw assignmentError;
            if (!assignment) {
                return res.status(403).json({ success: false, message: 'Tracking assignment is not owned by this driver' });
            }
        }

        const trackingStatus = getTrackingStatus(status);
        const currentLocation = getCurrentLocation(description, latitude, longitude);

        const { error } = await supabase
            .from('container_tracking')
            .insert([
                {
                    order_id: orderId,
                    driver_id: driverId,
                    latitude: Number(latitude),
                    longitude: Number(longitude),
                    status: trackingStatus,
                    description,
                    current_location: currentLocation,
                    recorded_at: new Date()
                }
            ]);

        if (error) throw error;

        res.status(200).json({ success: true, message: 'Tracking updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Get Driver Profile and Documents
exports.getDriverDetails = async (req, res) => {
    try {
        const driverId = req.driver.driver_id;

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

        // driverId is interpolated into a PostgREST .or() filter string below, so it
        // must be restricted to safe characters before that - otherwise commas/dots
        // in a crafted value could inject extra filter clauses.
        if (!/^[a-zA-Z0-9_-]+$/.test(driverId)) {
            return res.status(400).json({ success: false, message: 'Invalid Driver ID format' });
        }

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

        if (!data.password_hash) {
            console.log('Driver has no password set - cannot log in until admin issues one');
            return res.status(401).json({ success: false, message: 'No password set for this account. Contact your administrator.' });
        }

        const isMatch = await bcrypt.compare(password, data.password_hash);
        if (!isMatch) {
            console.log('Password Mismatch');
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        if (!process.env.DRIVER_JWT_SECRET) {
            return res.status(500).json({ success: false, message: 'Authentication is not configured' });
        }

        console.log('Match Found:', data.first_name, data.last_name);

        // Fetch associated vehicle details
        const { data: vehicleData } = await supabase
            .from('vehicles')
            .select('*')
            .eq('supplier_id', data.supplier_id)
            .limit(1)
            .single();

        const { password_hash, ...driverWithoutHash } = data;

        const token = jwt.sign(
            { driver_id: data.driver_id, role: 'driver' },
            process.env.DRIVER_JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                ...driverWithoutHash,
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
        const { oldPassword, newPassword } = req.body;
        const driverId = req.driver.driver_id;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
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

        // 2. Verify Old Password - always required, no unverified bypass
        if (!data.password_hash) {
            return res.status(400).json({ success: false, message: 'No password set for this account. Contact your administrator.' });
        }

        const isMatch = await bcrypt.compare(oldPassword, data.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password incorrect' });
        }

        // 3. Hash New Password
        const salt = await bcrypt.genSalt(12);
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
        const internalId = req.driver.driver_id;

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

        // Fetch the latest journey progress from the history table
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

        // Confirm this assignment actually belongs to the calling driver before
        // letting them update it or its order.
        const { data: ownedAssignment, error: ownError } = await supabase
            .from('order_assignments')
            .select('driver_id')
            .eq('assignment_id', assignmentId)
            .single();

        if (ownError || !ownedAssignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }
        if (ownedAssignment.driver_id !== req.driver.driver_id) {
            return res.status(403).json({ success: false, message: 'Not your assignment' });
        }

        // 1. Only update the high-level assignment status for critical milestones
        // This avoids "check constraint" errors for intermediate stages like 'started'
        const coreStatuses = ['assigned', 'delivered', 'completed'];
        if (coreStatuses.includes(status.toLowerCase())) {
            console.log('Updating core assignment status to:', status);
            const { error: assignmentError } = await supabase
                .from('order_assignments')
                .update({ status: status.toLowerCase() })
                .eq('assignment_id', assignmentId);

            if (assignmentError) {
                console.error('Step 1 (Assignment) Failed:', assignmentError.message);
                throw assignmentError;
            }
        } else {
            console.log('Skipping order_assignments update for intermediate stage:', status);
        }

        // 2. Add a detailed record to order_tracking_history
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

        // 3. Write to container_tracking so logistics/operations see live position
        const { data: assignment } = await supabase
            .from('order_assignments')
            .select('driver_id')
            .eq('assignment_id', assignmentId)
            .single();

        await supabase.from('container_tracking').insert([{
            order_id: orderId,
            driver_id: assignment?.driver_id || null,
            latitude: latitude || null,
            longitude: longitude || null,
            current_location: locationName || null,
            status: status,
            recorded_at: new Date()
        }]);

        // 4. Map driver stage to order-level status and update orders table
        const statusMap = {
            started: 'in_transit',
            in_transit: 'in_transit',
            at_freezone: 'at_freezone',
            at_port: 'at_port',
            delivered: 'completed',
            completed: 'completed',
        };
        const orderStatus = statusMap[status.toLowerCase()];
        if (orderStatus) {
            await supabase.from('orders').update({ current_status: orderStatus }).eq('order_id', orderId);
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
        const { orderId, documentType, base64Image } = req.body;
        const driverId = req.driver.driver_id;

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
        const { active } = req.body;
        const driverId = req.driver.driver_id;
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
        const { first_name, last_name, contact_number, emergency_contact } = req.body;

        console.log('--- Profile Update Attempt ---');
        console.log('Received Body:', JSON.stringify(req.body, null, 2));

        // Always update the authenticated driver's own row - never a
        // client-supplied ID, which would let any driver edit anyone's profile.
        const { error } = await supabase
            .from('drivers')
            .update({
                first_name,
                last_name,
                contact_number,
                emergency_contact,
                updated_at: new Date()
            })
            .eq('driver_id', req.driver.driver_id);

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
        const internalId = req.driver.driver_id;

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

exports.getDriverNotifications = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select(`
                id,
                driver_id,
                order_id,
                title,
                message,
                type,
                is_read,
                created_at,
                orders (order_reference)
            `)
            .eq('driver_id', req.driver.driver_id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        res.status(200).json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Fetch Driver Notifications Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};

exports.registerPushToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token || !Expo.isExpoPushToken(token)) {
            return res.status(400).json({ success: false, message: 'Invalid Expo push token' });
        }

        const { error } = await supabase
            .from('drivers')
            .update({ expo_push_token: token, updated_at: new Date() })
            .eq('driver_id', req.driver.driver_id);

        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Register Push Token Error:', error);
        res.status(500).json({ success: false, message: 'Failed to register notifications' });
    }
};

exports.clearPushToken = async (req, res) => {
    try {
        const { error } = await supabase
            .from('drivers')
            .update({ expo_push_token: null, updated_at: new Date() })
            .eq('driver_id', req.driver.driver_id);

        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Clear Push Token Error:', error);
        res.status(500).json({ success: false, message: 'Failed to clear notifications' });
    }
};

/**
 * 11. Report a New Issue
 */
exports.reportIssue = async (req, res) => {
    try {
        const { orderId, assignmentId, supplierId, issueType, priority, description } = req.body;
        const driverId = req.driver.driver_id;

        console.log('--- New Issue Report ---');
        console.log('Driver:', driverId, '| Type:', issueType, '| Priority:', priority);

        if (!issueType || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: issueType, description'
            });
        }

        const toIntegerOrNull = (value) => {
            if (value === null || value === undefined || value === '') return null;
            const parsed = Number.parseInt(value, 10);
            return Number.isInteger(parsed) ? parsed : null;
        };

        let resolvedOrderId = toIntegerOrNull(orderId);
        let resolvedSupplierId = toIntegerOrNull(supplierId);
        const resolvedAssignmentId = toIntegerOrNull(assignmentId);
        const resolvedDriverId = toIntegerOrNull(driverId);

        if (!resolvedDriverId) {
            return res.status(401).json({
                success: false,
                message: 'Could not identify the logged-in driver'
            });
        }

        if ((!resolvedOrderId || !resolvedSupplierId) && resolvedAssignmentId && resolvedDriverId) {
            const { data: assignment, error: assignmentError } = await supabase
                .from('order_assignments')
                .select('order_id, orders (supplier_id)')
                .eq('assignment_id', resolvedAssignmentId)
                .eq('driver_id', resolvedDriverId)
                .maybeSingle();

            if (assignmentError) throw assignmentError;
            resolvedOrderId = resolvedOrderId || assignment?.order_id || null;
            resolvedSupplierId = resolvedSupplierId || assignment?.orders?.supplier_id || null;
        }

        if (!resolvedOrderId && resolvedDriverId) {
            const { data: activeAssignment, error: activeAssignmentError } = await supabase
                .from('order_assignments')
                .select('order_id, orders (supplier_id)')
            .eq('driver_id', resolvedDriverId)
            .not('status', 'in', '(completed,delivered)')
                .order('assigned_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (activeAssignmentError) throw activeAssignmentError;
            resolvedOrderId = activeAssignment?.order_id || null;
            resolvedSupplierId = resolvedSupplierId || activeAssignment?.orders?.supplier_id || null;
        }

        const { data, error } = await supabase
            .from('issues')
            .insert([{
                driver_id: resolvedDriverId,
                order_id: resolvedOrderId,
                supplier_id: resolvedSupplierId,
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
        res.status(500).json({ success: false, message: `Failed to report issue: ${error.message}` });
    }
};

/**
 * 12. Upload Profile Photo
 */
exports.uploadProfilePhoto = async (req, res) => {
    try {
        const { base64Image } = req.body;
        const driverId = req.driver.driver_id;

        console.log('--- Profile Photo Upload ---');
        console.log('Driver ID:', driverId);

        if (!base64Image) {
            return res.status(400).json({ success: false, message: 'Missing image data' });
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
        const driverId = req.driver.driver_id;

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
        const driverId = req.driver.driver_id;

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
                    pickup_country:pickup_district,
                    pickup_state:pickup_location,
                    destination_country:destination_district,
                    destination_state:destination_location
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
        const normalizedType = String(req.params.type || '').trim().toLowerCase();
        if (!['import', 'export'].includes(normalizedType)) {
            return res.status(400).json({ success: false, message: 'Order type must be import or export' });
        }

        console.log(`--- Stage Fetch Start ---`);
        console.log(`Requesting stages for type: "${normalizedType}"`);

        const { data, error } = await supabase
            .from('tracking_stages')
            .select('*')
            .ilike('order_type', normalizedType)
            .order('sequence_order', { ascending: true });

        if (error) {
            console.error('DB Error fetching stages:', error.message);
            throw error;
        }

        console.log(`Successfully found ${data?.length || 0} stages for ${normalizedType}`);
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
        const driverId = req.driver.driver_id;

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

