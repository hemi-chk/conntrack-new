import { supabase } from '../config/supabase.js';

// --- DASHBOARD METHODS ---

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

// --- BIDS ---

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
// --- FINALIZE ORDER ---

export const finalizeOrder = async (req, res) => {
    const { orderId } = req.params;
    const { selectionId, bidId } = req.body;
    const userId = req.user?.id;

    try {
        // 1️⃣ Fetch order details to know who created it (Operations)
        const { data: orderData } = await supabase
            .from('orders')
            .select('created_by, order_reference')
            .eq('order_id', orderId)
            .single();

        // 2️⃣ Accept selected bid & record selector
        await supabase
            .from('bid_selection')
            .update({
                selection_status: 'accepted',
                selected_by: userId || null
            })
            .eq('selection_id', selectionId);

        // 3️⃣ Reject all other shortlisted bids
        await supabase
            .from('bid_selection')
            .update({
                selection_status: 'rejected'
            })
            .eq('order_id', orderId)
            .neq('selection_id', selectionId);

        // 4️⃣ Update bids table
        await supabase
            .from('bids')
            .update({ bid_status: 'accepted' })
            .eq('bid_id', bidId);

        // 5️⃣ Update order status to 'bid_accepted'
        // (Wait for supplier to assign driver before moving to 'driver_assigned')
        await supabase
            .from('orders')
            .update({
                current_status: 'bid_accepted'
            })
            .eq('order_id', orderId);

        // 6️⃣ Notify Operational team
        if (orderData?.created_by) {
            await supabase
                .from('notifications')
                .insert([{
                    order_id: orderId,
                    recipient_id: orderData.created_by,
                    title: 'Winning Bid Selected',
                    message: `Logistics has selected a bid for ${orderData.order_reference || orderId}. Please notify the supplier.`,
                    type: 'system',
                    status: 'pending'
                }]);
        }

        res.status(200).json({ 
            success: true, 
            message: "Order finalized and sent to Operations for supplier notification." 
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
    const { type } = req.query;

    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`*, customers (customer_name)`)
            .eq('order_type', type)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json(
            data.map(order => ({
                ...order,
                customer_name: order.customers?.customer_name || 'N/A',
                route: `${order.pickup_state} → ${order.destination_state}`
            }))
        );

    } catch (error) {
        res.status(500).json({ message: "Error retrieving orders", error: error.message });
    }
};

// --- TRACKING (UPDATED 🔥) ---

export const getTrackingByOrderId = async (req, res) => {
    const { orderId } = req.params;

    try {
        const { data, error } = await supabase
            .from('container_tracking')
            .select(`
                tracking_id,
                status,
                current_location,
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
            .eq('order_id', orderId)
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

        const { data, error } = await supabase
            .from('issues')
            .insert([{
                order_id,
                supplier_id,
                driver_id,
                reported_by,
                issue_type,
                priority,
                description,
                status: 'open'
            }])
            .select();

        if (error) throw error;

        res.status(201).json({
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
                        current_location: stage_name, // ✅ Match tracking table column name

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