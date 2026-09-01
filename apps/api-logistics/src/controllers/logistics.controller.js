import { supabase } from '@conntrack/database';
import { publish } from '@conntrack/messaging';

// =========================================================
// LOGISTICS API CONTROLLER
// ---------------------------------------------------------
// This file contains all business logic for the logistics interface.
// It is intentionally separated from admin, supplier, and driver flows.
// Each section below maps to a logistics feature: dashboard, orders,
// tracking, documents, issues, notifications, and profile information.
// =========================================================

const normalizeNotificationRow = (row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type || 'info',
    priority: row.priority || 'medium',
    read: Boolean(row.is_read),
    createdAt: row.created_at,
    actionUrl: row.action_url || null,
    is_read: row.is_read,
    created_at: row.created_at,
    action_url: row.action_url || null,
});

export const createLogisticsNotification = async ({
    recipient_id,
    sender_id = null,
    order_id = null,
    issue_id = null,
    title,
    message,
    type = 'info',
    priority = 'medium',
    action_url = null,
}) => {
    if (!title || !message) {
        throw new Error('Notification title and message are required');
    }

    const { data, error } = await supabase
        .from('notifications_logistics')
        .insert([{
            recipient_id: recipient_id || null,
            sender_id: sender_id || null,
            order_id: order_id ?? null,
            issue_id: issue_id ?? null,
            title,
            message,
            type,
            priority,
            action_url: action_url || null,
            is_read: false,
            created_at: new Date().toISOString(),
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getNotifications = async (req, res) => {
    const recipientId = req.user?.id || req.user?.uuid;

    if (!recipientId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
        const { data, error } = await supabase
            .from('notifications_logistics')
            .select('*')
            .eq('recipient_id', recipientId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json((data || []).map(normalizeNotificationRow));
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load notifications', error: error.message });
    }
};

export const markNotificationAsRead = async (req, res) => {
    const { id } = req.params;
    const recipientId = req.user?.id || req.user?.uuid;

    if (!recipientId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
        const { data, error } = await supabase
            .from('notifications_logistics')
            .update({
                is_read: true,
                read_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('recipient_id', recipientId)
            .select();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            notifications: (data || []).map(normalizeNotificationRow),
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update notification', error: error.message });
    }
};

export const markAllNotificationsAsRead = async (req, res) => {
    const recipientId = req.user?.id || req.user?.uuid;

    if (!recipientId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
        const { data, error } = await supabase
            .from('notifications_logistics')
            .update({
                is_read: true,
                read_at: new Date().toISOString(),
            })
            .eq('recipient_id', recipientId)
            .eq('is_read', false)
            .select();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            notifications: (data || []).map(normalizeNotificationRow),
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to clear notifications', error: error.message });
    }
};

export const getMyProfile = async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, role, position, employee_id, contact_number, status, address')
            .eq('id', userId)
            .maybeSingle();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();

        return res.status(200).json({
            first_name: data.first_name,
            last_name: data.last_name,
            full_name: fullName,
            role: data.role,
            position: data.position || 'Logistics Handler',
            employee_id: data.employee_id || 'N/A',
            contact_number: data.contact_number || 'N/A',
            status: data.status || 'active',
            address: data.address || 'N/A',
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load profile', error: error.message });
    }
};

// -----------------------------------------------------------------------------
// DASHBOARD METHODS
// -----------------------------------------------------------------------------
// Used to power the logistics home page with the latest count summary and the
// recent activity feed shown in the dashboard cards and table.
export const getDashboardSummary = async (req, res) => {
    try {
        const [importRes, exportRes, inTransitRes, completedRes, activityRes] = await Promise.all([
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('order_type', 'import'),
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('order_type', 'export'),
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('current_status', 'in_transit'),
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('current_status', 'completed'),
            supabase.from('orders').select(`
                order_id, order_reference, order_type, current_status, created_at,
                pickup_state, destination_state, customers (customer_name)
            `).order('created_at', { ascending: false }).limit(5)
        ]);

        res.status(200).json({
            importOrdersCount: importRes.count || 0,
            exportOrdersCount: exportRes.count || 0,
            recentActivity: (activityRes.data || []).map(order => ({
                order_id: order.order_id,
                order_reference: order.order_reference || `ORD-${order.order_id}`,
                order_type: order.order_type,
                current_status: order.current_status,
                customer: order.customers?.customer_name || 'Internal',
                route: `${order.pickup_state} → ${order.destination_state}`,
                created_at: order.created_at
            })),
            stats: {
                inTransitCount: inTransitRes.count || 0,
                completedOrders: completedRes.count || 0
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Failed to fetch dashboard summary", error: error.message });
    }
};

// -----------------------------------------------------------------------------
// BIDS
// -----------------------------------------------------------------------------
// These endpoints supply supplier bids for a logistics order so the user can
// compare offers and finalize the assignment.
export const getShortlistedBids = async (req, res) => {
    const { orderId } = req.params;

    try {
        const { data, error } = await supabase
            .from('bid_selection')
            .select(`
                selection_id,
                bid_id,
                bids (
                    bid_id,
                    bid_amount,
                    eta,
                    suppliers (company_name, rating),
                    vehicles (vehicle_type)
                )
            `)
            .eq('order_id', orderId)
            .eq('selection_status', 'sent_to_logistics');

        if (error) throw error;

        const formatted = data.map(item => ({
            id: item.bid_id,
            selectionId: item.selection_id,
            supplierName: item.bids?.suppliers?.company_name || "Unknown",
            amount: item.bids?.bid_amount,
            rating: item.bids?.suppliers?.rating || 0,
            vehicle: item.bids?.vehicles?.vehicle_type || "N/A",
            eta: item.bids?.eta || "N/A"
        }));

        res.status(200).json(formatted);

    } catch (error) {
        res.status(500).json({ message: "Error retrieving bids", error: error.message });
    }
};

// -----------------------------------------------------------------------------
// FINALIZE ORDER
// -----------------------------------------------------------------------------
// Finalization confirms the winning supplier and marks the order as assigned in
// the logistics workflow.
export const finalizeOrder = async (req, res) => {
    const { orderId } = req.params;
    const { selectionId, bidId } = req.body;
    const userId = req.user?.id;

    try {
        // 1️⃣ Fetch order + winning bid details together
        const [{ data: orderData }, { data: winningBid }] = await Promise.all([
            supabase.from('orders').select('created_by, order_reference').eq('order_id', orderId).single(),
            supabase.from('bids').select('bid_id, supplier_id, bidding_id').eq('bid_id', bidId).single(),
        ]);

        const orderRef = orderData?.order_reference || `Order #${orderId}`;

        // 2️⃣ Accept selected bid_selection row
        await supabase
            .from('bid_selection')
            .update({ selection_status: 'accepted', selected_by: userId || null })
            .eq('selection_id', selectionId);

        // 3️⃣ Reject all other shortlisted bid_selection rows
        await supabase
            .from('bid_selection')
            .update({ selection_status: 'rejected' })
            .eq('order_id', orderId)
            .neq('selection_id', selectionId);

        // 4️⃣ Mark winning bid as accepted in bids table
        await supabase.from('bids').update({ bid_status: 'accepted' }).eq('bid_id', bidId);

        // 5️⃣ Mark all other bids for this order as rejected in bids table
        const { data: losingSelections } = await supabase
            .from('bid_selection')
            .select('bid_id, supplier_id')
            .eq('order_id', orderId)
            .eq('selection_status', 'rejected');

        if (losingSelections?.length) {
            const losingBidIds = losingSelections.map(s => s.bid_id);
            await supabase.from('bids').update({ bid_status: 'rejected' }).in('bid_id', losingBidIds);
        }

        // 6️⃣ Update order status
        await supabase.from('orders').update({ current_status: 'bid_accepted' }).eq('order_id', orderId);

        // 7️⃣ Create order_assignments row for the winning supplier (driver assigned later by Operations)
        if (winningBid?.supplier_id) {
            await supabase.from('order_assignments').insert([{
                order_id: Number(orderId),
                supplier_id: winningBid.supplier_id,
                bid_id: bidId,
                status: 'pending_driver',
                assigned_at: new Date().toISOString(),
            }]);
        }

        // 8️⃣ Notify Operations team
        if (orderData?.created_by) {
            await createLogisticsNotification({
                recipient_id: orderData.created_by,
                sender_id: req.user?.id || null,
                order_id: Number(orderId),
                title: 'Winning Bid Selected',
                message: `Logistics has selected a winning bid for ${orderRef}. Please assign a driver to proceed.`,
                type: 'order',
                priority: 'high',
                action_url: `/orders/${orderId}`,
            });
        }

        // 9️⃣ Notify current logistics user of the successful selection
        if (req.user?.id) {
            await createLogisticsNotification({
                recipient_id: req.user.id,
                sender_id: req.user.id,
                order_id: Number(orderId),
                title: 'Carrier Selected',
                message: `Carrier selection for ${orderRef} was completed successfully.`,
                type: 'order',
                priority: 'medium',
                action_url: `/orders/${orderId}`,
            });
        }

        // 🔟 Notify losing suppliers (kept in supplier-side system; no logistics table requirement here)
        if (losingSelections?.length) {
            const losingSupplierIds = [...new Set(losingSelections.map(s => s.supplier_id).filter(Boolean))];
            if (losingSupplierIds.length) {
                for (const supplierId of losingSupplierIds) {
                    await createLogisticsNotification({
                        recipient_id: supplierId,
                        order_id: Number(orderId),
                        title: 'Bid Not Selected',
                        message: `Thank you for bidding on order ${orderRef}. Another supplier has been selected for this order.`,
                        type: 'order',
                        priority: 'medium',
                        action_url: `/orders/${orderId}`,
                    });
                }
            }
        }

        // Publish events for message consumers
        await publish('bid.accepted', {
            order_id: Number(orderId),
            order_reference: orderRef,
            supplier_id: winningBid?.supplier_id,
            bid_id: bidId,
        });

        if (losingSelections?.length) {
            for (const s of losingSelections) {
                if (s.supplier_id) {
                    await publish('bid.rejected', {
                        order_id: Number(orderId),
                        order_reference: orderRef,
                        supplier_id: s.supplier_id,
                        bid_id: s.bid_id,
                    });
                }
            }
        }

        res.status(200).json({
            success: true,
            message: "Order finalized. Supplier notified, Operations team alerted to assign a driver.",
        });

    } catch (error) {
        res.status(500).json({ message: "Finalize failed", error: error.message });
    }
};

// --- ORDERS ---

export const getOrderById = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                customers (customer_name),
                order_assignments (
                    *,
                    suppliers (company_name),
                    drivers (first_name, last_name),
                    vehicles (vehicle_type, vehicle_number)
                ),
                documents:clearance_documents (*)
            `)
            .eq('order_id', id)
            .single();

        if (error) throw error;

        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ message: "Error retrieving order", error: error.message });
    }
};

export const getOrdersByType = async (req, res) => {
    const type = typeof req.query.type === 'string'
        ? req.query.type.trim().toLowerCase()
        : '';

    try {
        let ordersQuery = supabase
            .from('orders')
            .select(`*, customers (customer_name)`)
            .order('created_at', { ascending: false });

        if (type) {
            ordersQuery = ordersQuery.eq('order_type', type);
        }

        const { data, error } = await ordersQuery;

        if (error) throw error;

        res.status(200).json(
            data.map(order => {
                const pickup = order.pickup_location || order.pickup_state || order.pickup_district || 'N/A';
                const destination = order.destination_location || order.destination_state || order.destination_district || 'N/A';

                return {
                    ...order,
                    customer_name: order.customers?.customer_name || 'N/A',
                    route: `${pickup} → ${destination}`
                };
            })
        );

    } catch (error) {
        res.status(500).json({ message: "Error retrieving orders", error: error.message });
    }
};

// --- TRACKING ---

export const getTrackingByOrderId = async (req, res) => {
    const { orderId } = req.params;

    try {
        let actualOrderId = orderId;

        // If the orderId is not a numeric string, treat it as order_reference
        if (orderId && !/^\d+$/.test(orderId)) {
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('order_id')
                .eq('order_reference', orderId)
                .maybeSingle();

            if (orderError) throw orderError;
            if (!orderData) {
                return res.status(200).json({ trackingAvailable: false });
            }
            actualOrderId = orderData.order_id;
        }

        const { data, error } = await supabase
            .from('container_tracking')
            .select(`
                tracking_id,
                status,
                current_location,
                latitude,
                longitude,
                recorded_at,

                orders (
                    *,
                    order_assignments (
                        assignment_id,
                        vehicle_id,
                        vehicles (
                            vehicle_id,
                            vehicle_number,
                            vehicle_type,
                            condition_status,
                            availability_status
                        )
                    )
                ),

                drivers (
                    driver_id,
                    first_name,
                    last_name,
                    license_number,
                    contact_number,
                    supplier_id,
                    suppliers (
                        supplier_id,
                        company_name,
                        registration_number,
                        contact_number,
                        email,
                        rating
                    )
                )
            `)
            .eq('order_id', actualOrderId)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        if (!data) {
            return res.status(200).json({ trackingAvailable: false });
        }

        const vehicle = data.orders?.order_assignments?.[0]?.vehicles;

        const result = {
            trackingAvailable: true,

            tracking_details: {
                status: data.status,
                location: data.current_location,
                latitude: data.latitude,
                longitude: data.longitude,
                timestamp: data.recorded_at
            },

            order_details: data.orders,

            driver_details: {
                name: `${data.drivers?.first_name} ${data.drivers?.last_name}`,
                phone: data.drivers?.contact_number,
                license: data.drivers?.license_number
            },

            supplier_details: data.drivers?.suppliers,

            vehicle_details: vehicle
                ? {
                    number: vehicle.vehicle_number,
                    type: vehicle.vehicle_type,
                    condition: vehicle.condition_status,
                    availability: vehicle.availability_status
                }
                : null
        };

        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateTrackingLocation = async (req, res) => {
    try {
        const { order_id, driver_id, current_location, status, latitude, longitude } = req.body;

        const { data, error } = await supabase
            .from('container_tracking')
            .insert([{
                order_id: Number(order_id),
                driver_id: driver_id ? Number(driver_id) : null,
                current_location,
                status: status || 'in_transit',
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                recorded_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: data ? data[0] : null
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// -----------------------------------------------------------------------------
// ISSUES
// -----------------------------------------------------------------------------
// Issue creation is the escalation path when a shipment, vehicle, supplier, or
// route problem must be reported for admin review and follow-up.
export const createIssue = async (req, res) => {
    try {
        const {
            order_id,
            supplier_id,
            driver_id,
            issue_type,
            priority,
            description,
            reported_by
        } = req.body;

        const cleanOrderId = order_id && order_id !== "" ? parseInt(order_id, 10) : null;
        const cleanSupplierId = supplier_id && supplier_id !== "" ? parseInt(supplier_id, 10) : null;
        const cleanDriverId = driver_id && driver_id !== "" ? parseInt(driver_id, 10) : null;
        const cleanReportedBy = reported_by && reported_by !== "" ? reported_by : null;

        const { data, error } = await supabase
            .from('issues')
            .insert([{
                order_id: cleanOrderId,
                supplier_id: cleanSupplierId,
                driver_id: cleanDriverId,
                reported_by: cleanReportedBy,
                issue_type,
                priority,
                description,
                status: 'open'
            }])
            .select();

        if (error) throw error;

        const issue = data?.[0];
        const notificationRecipient = cleanReportedBy || req.user?.id || null;

        if (notificationRecipient) {
            await createLogisticsNotification({
                recipient_id: notificationRecipient,
                sender_id: req.user?.id || cleanReportedBy || null,
                issue_id: issue?.issue_id ?? null,
                order_id: cleanOrderId,
                title: 'Issue reported successfully',
                message: `Your ${issue_type} issue has been submitted for admin review.`,
                type: 'issue',
                priority: priority || 'medium',
                action_url: '/issues',
            });
        }

        res.status(201).json({
            success: true,
            data: issue
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const getAllIssues = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('issues')
            .select(`
                *,
                orders (order_reference),
                suppliers (company_name),
                drivers (first_name, last_name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const updateIssueStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const updateData = { status };
        if (status === 'resolved') {
            updateData.resolved_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('issues')
            .update(updateData)
            .eq('issue_id', id)
            .select();

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: data[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// --- REPORTS ---

export const getFilteredReports = async (req, res) => {
    const { fromDate, toDate } = req.query;

    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`*, customers (customer_name)`)
            .gte('created_at', `${fromDate}T00:00:00Z`)
            .lte('created_at', `${toDate}T23:59:59Z`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const total = orders.length;
        const completedCount = orders.filter(o => o.current_status === 'completed').length;
        const imports = orders.filter(o => o.order_type === 'import').length;
        const exports = orders.filter(o => o.order_type === 'export').length;

        const successRate = total > 0
            ? ((completedCount / total) * 100).toFixed(1)
            : "0";

        res.status(200).json({
            orders: orders.map(order => ({
                ...order,
                customer_name: order.customers?.customer_name || 'Internal'
            })),
            stats: {
                total,
                completedCount,
                imports,
                exports,
                successRate
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to generate report",
            error: error.message
        });
    }
};

// --- DOCUMENTS ---

export const uploadDocuments = async (req, res) => {
    try {
        const {
            order_id,
            stage_name,
            uploaded_by
        } = req.body;

        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({
                message: "No files uploaded"
            });
        }

        const uploadedDocuments = [];

        for (const file of files) {
            const fileName = `${Date.now()}-${file.originalname}`;
            const filePath = `orders/${order_id}/${stage_name}/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } =
                await supabase.storage
                    .from("clearance_documents")
                    .upload(filePath, file.buffer, {
                        contentType: file.mimetype
                    });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from("clearance_documents")
                .getPublicUrl(filePath);

            // Insert into DB
            const { data: insertedDoc, error: insertError } =
                await supabase
                    .from("clearance_documents")
                    .insert([{
                        order_id,
                        document_name: file.originalname,
                        document_type: file.mimetype,
                        file_url: publicUrlData.publicUrl,
                        uploaded_by: (uploaded_by && uploaded_by !== "temp-user-id") ? uploaded_by : null,
                        current_location: stage_name, // Match tracking table column name
                        status: "pending"
                    }])
                    .select()
                    .single();

            if (insertError) {
                console.error("DB Insert Error:", insertError);
                throw insertError;
            }

            uploadedDocuments.push(insertedDoc);
        }

        return res.status(201).json({
            success: true,
            documents: uploadedDocuments
        });

    } catch (error) {
        console.error("Upload Documents Controller Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteDocument = async (req, res) => {
    const { id } = req.params;

    try {
        const { data: doc, error: fetchError } = await supabase
            .from('clearance_documents')
            .select('file_url')
            .eq('document_id', parseInt(id))
            .single();

        if (fetchError || !doc) {
            return res.status(404).json({ success: false, message: "Document not found" });
        }

        const encodedPath = doc.file_url.split('/clearance_documents/')[1];
        const storagePath = decodeURIComponent(encodedPath);

        if (storagePath) {
            await supabase.storage.from('clearance_documents').remove([storagePath]);
        }

        const { error: dbError } = await supabase
            .from('clearance_documents')
            .delete()
            .eq('document_id', parseInt(id));

        if (dbError) throw dbError;

        res.status(200).json({
            success: true,
            message: "Document deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
