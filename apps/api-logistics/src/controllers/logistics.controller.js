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
                pickup_location, pickup_district, destination_location, destination_district, customers (customer_name)
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
                route: `${order.pickup_location || order.pickup_district || 'N/A'} → ${order.destination_location || order.destination_district || 'N/A'}`,
                created_at: order.created_at
            })),
            stats: {
                inTransitCount: inTransitRes.count || 0,
                completedOrders: completedRes.count || 0
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch dashboard summary",
            error: error.message
        });
    }
};


// ============================================================
// BIDS
// ============================================================

export const getShortlistedBids = async (req, res) => {
    const { orderId } = req.params;

    try {

        // ----------------------------------------------------
        // 1. RESOLVE ORDER ID
        //
        // Supports:
        // 42
        //
        // OR:
        // EXP-00045
        //
        // This prevents the Logistics page from showing
        // 0 candidates just because frontend sent the
        // order_reference instead of internal order_id.
        // ----------------------------------------------------

        let actualOrderId = orderId;

        if (orderId && !/^\d+$/.test(String(orderId))) {

            const { data: orderData, error: orderError } =
                await supabase
                    .from('orders')
                    .select('order_id')
                    .eq('order_reference', orderId)
                    .maybeSingle();

            if (orderError) throw orderError;

            if (!orderData) {
                return res.status(200).json([]);
            }

            actualOrderId = orderData.order_id;

        } else {
            actualOrderId = Number(orderId);
        }


        // ----------------------------------------------------
        // 2. GET ONLY THE BIDS SHORTLISTED BY OPERATIONS
        //
        // IMPORTANT:
        // We do NOT fall back to every bid in the bids table.
        //
        // Logistics must only see bids that Operations placed
        // inside bid_selection.
        // ----------------------------------------------------

        const {
            data: selectionData,
            error: selectionError
        } = await supabase
            .from('bid_selection')
            .select(`
                selection_id,
                bid_id,
                order_id,
                selection_status,
                selected,
                selected_by,
                reason,
                selected_at,

                bids (
                    bid_id,
                    bid_amount,
                    eta,
                    bid_status,

                    suppliers (
                        supplier_id,
                        company_name,
                        email,
                        rating
                    ),

                    vehicles (
                        vehicle_id,
                        vehicle_type
                    )
                )
            `)
            .eq('order_id', actualOrderId)
            .order('selection_id', { ascending: true });


        if (selectionError) {
            throw selectionError;
        }


        // ----------------------------------------------------
        // 3. NO SHORTLIST SENT BY OPERATIONS
        // ----------------------------------------------------

        if (!selectionData || selectionData.length === 0) {

            return res.status(200).json([]);

        }


        // ----------------------------------------------------
        // 4. FORMAT FOR LOGISTICS FRONTEND
        //
        // Possible statuses:
        //
        // SHORTLISTED
        // WINNER
        // REJECTED
        // ----------------------------------------------------

        const formatted = selectionData.map(item => {

            const rawSelectionStatus =
                String(item.selection_status || "")
                    .trim()
                    .toLowerCase();

            let selectionStatus = "SHORTLISTED";

            if (
                rawSelectionStatus === "accepted" ||
                rawSelectionStatus === "winner" ||
                rawSelectionStatus === "selected" ||
                item.selected === true
            ) {
                selectionStatus = "WINNER";
            } else if (
                rawSelectionStatus === "rejected" ||
                rawSelectionStatus === "not_selected" ||
                rawSelectionStatus === "not selected"
            ) {
                selectionStatus = "REJECTED";
            }


            return {

                id: item.bid_id,

                selectionId:
                    item.selection_id,

                orderId:
                    item.order_id,

                selectionStatus,

                selected:
                    item.selected,

                selectedBy:
                    item.selected_by,

                selectedAt:
                    item.selected_at,

                reason:
                    item.reason,

                supplierName:
                    item.bids?.suppliers?.company_name ||
                    "Unknown Supplier",

                supplierEmail:
                    item.bids?.suppliers?.email ||
                    null,

                amount:
                    item.bids?.bid_amount,

                rating:
                    item.bids?.suppliers?.rating || 0,

                vehicle:
                    item.bids?.vehicles?.vehicle_type ||
                    "N/A",

                vehicleType:
                    item.bids?.vehicles?.vehicle_type ||
                    "N/A",

                eta:
                    item.bids?.eta || null
            };

        });


        return res.status(200).json(formatted);


    } catch (error) {

        console.error(
            "Get Shortlisted Bids Error:",
            error
        );

        return res.status(500).json({
            message: "Error retrieving shortlisted bids",
            error: error.message
        });

    }
};


// ============================================================
// FINALIZE ORDER
// LOGISTICS SELECTS FINAL WINNER
// ============================================================

export const finalizeOrder = async (req, res) => {

    const { orderId } = req.params;

    const {
        selectionId,
        bidId,
        reason
    } = req.body;

    const userId = req.user?.id || null;


    try {

        // ----------------------------------------------------
        // 1. VALIDATE REQUEST
        // ----------------------------------------------------

        if (!selectionId || !bidId) {

            return res.status(400).json({
                success: false,
                message:
                    "selectionId and bidId are required."
            });

        }


        // ----------------------------------------------------
        // 2. RESOLVE ORDER ID
        //
        // Supports both:
        // 42
        // EXP-00045
        // ----------------------------------------------------

        let actualOrderId = orderId;

        let orderData = null;


        if (orderId && !/^\d+$/.test(String(orderId))) {

            const {
                data,
                error
            } = await supabase
                .from('orders')
                .select(`
                    order_id,
                    order_reference,
                    created_by
                `)
                .eq('order_reference', orderId)
                .maybeSingle();


            if (error) throw error;


            if (!data) {

                return res.status(404).json({
                    success: false,
                    message: "Order not found."
                });

            }


            actualOrderId = data.order_id;

            orderData = data;

        } else {

            actualOrderId = Number(orderId);


            const {
                data,
                error
            } = await supabase
                .from('orders')
                .select(`
                    order_id,
                    order_reference,
                    created_by
                `)
                .eq('order_id', actualOrderId)
                .maybeSingle();


            if (error) throw error;


            if (!data) {

                return res.status(404).json({
                    success: false,
                    message: "Order not found."
                });

            }


            orderData = data;
        }


        // ----------------------------------------------------
        // 3. CHECK THAT LOGISTICS SELECTED A BID WHICH
        //    OPERATIONS ACTUALLY SHORTLISTED
        //
        // Logistics cannot randomly choose another bid.
        // ----------------------------------------------------

        const {
            data: selectedSelection,
            error: selectedSelectionError
        } = await supabase
            .from('bid_selection')
            .select(`
                selection_id,
                bid_id,
                order_id,
                selection_status,
                selected,

                bids (
                    bid_id,
                    bid_amount,

                    suppliers (
                        company_name
                    )
                )
            `)
            .eq('selection_id', selectionId)
            .eq('order_id', actualOrderId)
            .maybeSingle();


        if (selectedSelectionError) {
            throw selectedSelectionError;
        }


        if (!selectedSelection) {

            return res.status(400).json({
                success: false,
                message:
                    "This bid was not shortlisted by Operations."
            });

        }


        // ----------------------------------------------------
        // 4. MAKE SURE BID ID MATCHES THE SHORTLIST RECORD
        // ----------------------------------------------------

        if (
            Number(selectedSelection.bid_id) !==
            Number(bidId)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Selected bid does not match the shortlist record."
            });

        }


        const rawCurrentSelectionStatus =
            String(selectedSelection.selection_status || "")
                .trim()
                .toLowerCase();

        let currentSelectionStatus = "SHORTLISTED";

        if (
            rawCurrentSelectionStatus === "accepted" ||
            rawCurrentSelectionStatus === "winner" ||
            rawCurrentSelectionStatus === "selected" ||
            selectedSelection.selected === true
        ) {
            currentSelectionStatus = "WINNER";
        } else if (
            rawCurrentSelectionStatus === "rejected" ||
            rawCurrentSelectionStatus === "not_selected" ||
            rawCurrentSelectionStatus === "not selected"
        ) {
            currentSelectionStatus = "REJECTED";
        }


        // ----------------------------------------------------
        // 5. PREVENT REJECTED BID FROM BECOMING WINNER
        // ----------------------------------------------------

        if (currentSelectionStatus === "REJECTED") {

            return res.status(400).json({
                success: false,
                message:
                    "This bid has already been rejected."
            });

        }


        // ----------------------------------------------------
        // 6. IF SAME BID ALREADY WINNER
        // RETURN SUCCESS
        // ----------------------------------------------------

        if (currentSelectionStatus === "WINNER") {

            return res.status(200).json({
                success: true,
                alreadyFinalized: true,
                message:
                    "This carrier has already been selected as the winner."
            });

        }


        // ----------------------------------------------------
        // 7. CHECK IF ANOTHER WINNER ALREADY EXISTS
        //
        // Only ONE winner per order.
        // ----------------------------------------------------

        const {
            data: existingWinner,
            error: winnerCheckError
        } = await supabase
            .from('bid_selection')
            .select(`
                selection_id,
                bid_id,
                selection_status,
                selected
            `)
            .eq('order_id', actualOrderId)
            .or('selection_status.eq.accepted,selected.eq.true')
            .neq('selection_id', selectionId)
            .limit(1);


        if (winnerCheckError) {
            throw winnerCheckError;
        }


        if (
            existingWinner &&
            existingWinner.length > 0
        ) {

            return res.status(409).json({
                success: false,
                message:
                    "A winner has already been selected for this order."
            });

        }


        const decisionTime =
            new Date().toISOString();


        // ----------------------------------------------------
        // 8. MARK SELECTED BID AS WINNER
        //
        // IMPORTANT:
        // Database constraint uses lowercase status values.
        // accepted = winner
        // rejected = unsuccessful
        // ----------------------------------------------------

        const {
            error: winnerUpdateError
        } = await supabase
            .from('bid_selection')
            .update({

                selection_status:
                    'accepted',

                selected:
                    true,

                selected_by:
                    userId,

                selected_at:
                    decisionTime,

                reason:
                    reason || null

            })
            .eq(
                'selection_id',
                selectionId
            )
            .eq(
                'order_id',
                actualOrderId
            );


        if (winnerUpdateError) {
            throw winnerUpdateError;
        }


        // ----------------------------------------------------
        // 9. MARK ALL OTHER SHORTLISTED BIDS AS REJECTED
        //
        // Works whether Operations sent 1, 2, 3, 4, or 5 bids.
        // ----------------------------------------------------

        const {
            error: rejectSelectionError
        } = await supabase
            .from('bid_selection')
            .update({

                selection_status:
                    'rejected',

                selected:
                    false

            })
            .eq(
                'order_id',
                actualOrderId
            )
            .neq(
                'selection_id',
                selectionId
            );


        if (rejectSelectionError) {
            throw rejectSelectionError;
        }


        // ----------------------------------------------------
        // 10. UPDATE ORIGINAL BIDS TABLE
        //
        // Winner = accepted
        // Every other bid = rejected
        //
        // This includes suppliers that were not in the final 5.
        // Therefore Operations can later notify every
        // unsuccessful supplier.
        // ----------------------------------------------------

        const {
            error: acceptBidError
        } = await supabase
            .from('bids')
            .update({
                bid_status: 'accepted'
            })
            .eq('bid_id', bidId)
            .eq('order_id', actualOrderId);


        if (acceptBidError) {
            throw acceptBidError;
        }


        const {
            error: rejectBidsError
        } = await supabase
            .from('bids')
            .update({
                bid_status: 'rejected'
            })
            .eq('order_id', actualOrderId)
            .neq('bid_id', bidId);


        if (rejectBidsError) {
            throw rejectBidsError;
        }


        // ----------------------------------------------------
        // 11. UPDATE ORDER STATUS
        // ----------------------------------------------------

        const {
            error: orderUpdateError
        } = await supabase
            .from('orders')
            .update({
                current_status:
                    'bid_accepted'
            })
            .eq(
                'order_id',
                actualOrderId
            );


        if (orderUpdateError) {
            throw orderUpdateError;
        }


        // ----------------------------------------------------
        // 12. GET WINNER NAME
        // ----------------------------------------------------

        const supplierName =
            selectedSelection
                ?.bids
                ?.suppliers
                ?.company_name ||
            "Selected Supplier";


        // ----------------------------------------------------
        // 13. NOTIFY OPERATIONS TEAM
        //
        // Logistics DOES NOT contact supplier.
        //
        // Logistics only sends the decision back to Operations.
        // ----------------------------------------------------

        if (orderData?.created_by) {

            const {
                error: notificationError
            } = await supabase
                .from('notifications')
                .insert([{

                    order_id:
                        actualOrderId,

                    recipient_id:
                        orderData.created_by,

                    title:
                        'Winning Bid Selected',

                    message:
                        `Logistics selected ${supplierName} as the winning carrier for ${orderData.order_reference || actualOrderId}. Please notify the selected and unsuccessful suppliers.`,

                    type:
                        'system',

                    status:
                        'pending'

                }]);


            if (notificationError) {

                console.error(
                    "Operations notification error:",
                    notificationError
                );

                // We do NOT fail the whole winner selection
                // because the database decision has already
                // been saved.
            }
        }


        // ----------------------------------------------------
        // 14. RETURN WINNER TO LOGISTICS FRONTEND
        // ----------------------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Winner selected successfully and decision sent to Operations.",

            decisionStatus:
                "WINNER_SELECTED",

            winner: {

                selectionId:
                    Number(selectionId),

                bidId:
                    Number(bidId),

                supplierName,

                amount:
                    selectedSelection
                        ?.bids
                        ?.bid_amount ||
                    null,

                status:
                    "WINNER",

                selectedAt:
                    decisionTime
            }

        });


    } catch (error) {

        console.error(
            "Finalize Order Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Finalize failed",

            error:
                error.message

        });

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
        res.status(500).json({
            message: "Error retrieving order",
            error: error.message
        });
    }
};


export const getOrdersByType = async (req, res) => {
    const { type } = req.query;

    try {
        let query = supabase
            .from('orders')
            .select(`*, customers (customer_name)`)
            .order('created_at', { ascending: false });

        if (type) {
            query = query.eq('order_type', type);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.status(200).json(
            data.map(order => ({
                ...order,
                customer_name:
                    order.customers?.customer_name || 'N/A',
                route:
                    `${order.pickup_location || order.pickup_district || 'N/A'} → ${order.destination_location || order.destination_district || 'N/A'}`
            }))
        );

    } catch (error) {
        res.status(500).json({
            message: "Error retrieving orders",
            error: error.message
        });
    }
};


// --- TRACKING (UPDATED 🔥) ---

export const getTrackingByOrderId = async (req, res) => {
    const { orderId } = req.params;

    try {
        let actualOrderId = orderId;

        // If the orderId is not a numeric string,
        // treat it as order_reference
        if (orderId && !/^\d+$/.test(orderId)) {

            const {
                data: orderData,
                error: orderError
            } = await supabase
                .from('orders')
                .select('order_id')
                .eq('order_reference', orderId)
                .maybeSingle();

            if (orderError) throw orderError;

            if (!orderData) {
                return res.status(200).json({
                    trackingAvailable: false
                });
            }

            actualOrderId =
                orderData.order_id;
        }

        const { data, error } =
            await supabase
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
                .order('recorded_at', {
                    ascending: false
                })
                .limit(1)
                .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(200).json({
                trackingAvailable: false
            });
        }

        const vehicle =
            data.orders
                ?.order_assignments
                ?.[0]
                ?.vehicles;

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
                name:
                    `${data.drivers?.first_name} ${data.drivers?.last_name}`,
                phone:
                    data.drivers?.contact_number,
                license:
                    data.drivers?.license_number
            },

            supplier_details:
                data.drivers?.suppliers,

            vehicle_details:
                vehicle
                    ? {
                        number:
                            vehicle.vehicle_number,
                        type:
                            vehicle.vehicle_type,
                        condition:
                            vehicle.condition_status,
                        availability:
                            vehicle.availability_status
                    }
                    : null
        };

        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
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

        const cleanOrderId =
            order_id && order_id !== ""
                ? parseInt(order_id, 10)
                : null;

        const cleanSupplierId =
            supplier_id && supplier_id !== ""
                ? parseInt(supplier_id, 10)
                : null;

        const cleanDriverId =
            driver_id && driver_id !== ""
                ? parseInt(driver_id, 10)
                : null;

        const cleanReportedBy =
            reported_by && reported_by !== ""
                ? reported_by
                : null;

        const { data, error } =
            await supabase
                .from('issues')
                .insert([{
                    order_id:
                        cleanOrderId,
                    supplier_id:
                        cleanSupplierId,
                    driver_id:
                        cleanDriverId,
                    reported_by:
                        cleanReportedBy,
                    issue_type,
                    priority,
                    description,
                    status:
                        'open'
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


export const getAllIssues = async (req, res) => {
    try {
        const { data, error } =
            await supabase
                .from('issues')
                .select(`
                    *,
                    orders (order_reference),
                    suppliers (company_name),
                    drivers (first_name, last_name)
                `)
                .order('created_at', {
                    ascending: false
                });

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
            updateData.resolved_at =
                new Date().toISOString();
        }

        const { data, error } =
            await supabase
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


export const getFilteredReports = async (req, res) => {
    const { fromDate, toDate } = req.query;

    try {
        let query = supabase
            .from('orders')
            .select(`
                *,
                customers (customer_name)
            `);

        if (fromDate) {
            query = query.gte('created_at', `${fromDate}T00:00:00Z`);
        }

        if (toDate) {
            query = query.lte('created_at', `${toDate}T23:59:59Z`);
        }

        const {
            data: orders,
            error
        } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        const total =
            orders.length;

        const completedCount =
            orders.filter(
                o =>
                    o.current_status ===
                    'completed'
            ).length;

        const imports =
            orders.filter(
                o =>
                    o.order_type ===
                    'import'
            ).length;

        const exports =
            orders.filter(
                o =>
                    o.order_type ===
                    'export'
            ).length;

        const successRate =
            total > 0
                ? (
                    (completedCount / total)
                    * 100
                ).toFixed(1)
                : "0";

        res.status(200).json({
            orders:
                orders.map(order => ({
                    ...order,
                    customer_name:
                        order.customers
                            ?.customer_name ||
                        'Internal'
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
            message:
                "Failed to generate report",
            error:
                error.message
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

            const fileName =
                `${Date.now()}-${file.originalname}`;

            const filePath =
                `orders/${order_id}/${stage_name}/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } =
                await supabase.storage
                    .from("clearance_documents")
                    .upload(
                        filePath,
                        file.buffer,
                        {
                            contentType:
                                file.mimetype
                        }
                    );

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: publicUrlData } =
                supabase.storage
                    .from("clearance_documents")
                    .getPublicUrl(filePath);

            // Insert into DB
            const {
                data: insertedDoc,
                error: insertError
            } =
                await supabase
                    .from("clearance_documents")
                    .insert([{
                        order_id,
                        document_name:
                            file.originalname,
                        document_type:
                            file.mimetype,
                        file_url:
                            publicUrlData.publicUrl,

                        uploaded_by:
                            (
                                uploaded_by &&
                                uploaded_by !==
                                "temp-user-id"
                            )
                                ? uploaded_by
                                : null,

                        current_location:
                            stage_name,

                        status:
                            "pending"
                    }])
                    .select()
                    .single();

            if (insertError) {
                console.error(
                    "DB Insert Error:",
                    insertError
                );
                throw insertError;
            }

            uploadedDocuments.push(
                insertedDoc
            );
        }

        return res.status(201).json({
            success: true,
            documents:
                uploadedDocuments
        });

    } catch (error) {

        console.error(
            "Upload Documents Controller Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


export const deleteDocument = async (req, res) => {
    const { id } = req.params;

    try {

        const {
            data: doc,
            error: fetchError
        } = await supabase
            .from('clearance_documents')
            .select('file_url')
            .eq(
                'document_id',
                parseInt(id)
            )
            .single();

        if (fetchError || !doc) {
            return res.status(404).json({
                success: false,
                message:
                    "Document not found"
            });
        }

        const encodedPath =
            doc.file_url
                .split(
                    '/clearance_documents/'
                )[1];

        const storagePath =
            decodeURIComponent(
                encodedPath
            );

        if (storagePath) {
            await supabase.storage
                .from(
                    'clearance_documents'
                )
                .remove([
                    storagePath
                ]);
        }

        const { error: dbError } =
            await supabase
                .from(
                    'clearance_documents'
                )
                .delete()
                .eq(
                    'document_id',
                    parseInt(id)
                );

        if (dbError) throw dbError;

        res.status(200).json({
            success: true,
            message:
                "Document deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message:
                error.message
        });

    }
};


export const updateTrackingLocation = async (req, res) => {
    try {
        const {
            order_id,
            driver_id,
            latitude,
            longitude,
            current_location,
            status
        } = req.body;

        if (
            !order_id ||
            latitude == null ||
            longitude == null
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "order_id, latitude and longitude are required"
            });
        }

        const { data, error } =
            await supabase
                .from(
                    "container_tracking"
                )
                .insert({
                    order_id,
                    driver_id:
                        driver_id || null,
                    latitude,
                    longitude,
                    current_location:
                        current_location ||
                        null,
                    status:
                        status ||
                        "in_transit"
                })
                .select()
                .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Tracking update error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update tracking location",
            error:
                error.message
        });

    }
};