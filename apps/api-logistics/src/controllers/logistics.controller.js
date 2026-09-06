import PDFDocument from 'pdfkit';
import { supabase } from '../config/supabase.js';

// =========================================================
// LOGISTICS API CONTROLLER
// ---------------------------------------------------------
// This file contains all business logic for the logistics interface.
// It is intentionally separated from admin, supplier, and driver flows.
// Each section below maps to a logistics feature: dashboard, orders,
// tracking, documents, issues, notifications, and profile information.
// =========================================================

// =========================================================
// NOTIFICATION UTILITIES & ENDPOINTS
// ---------------------------------------------------------
// Standalone notification handlers for the logistics module.
// Stores records in `notifications_logistics` table.
// =========================================================

/**
 * Normalizes DB notification row format to match frontend object schema.
 */
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

/**
 * Helper function to create a new logistics notification record in Supabase.
 * Can be called internally whenever key events occur (tracking updates, issue reports, bid finalization, doc upload/deletion).
 */
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

/**
 * GET /logistics/notifications
 * Retrieves all notifications for the authenticated logistics user, ordered newest first.
 */
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

/**
 * PATCH /logistics/notifications/:id/read
 * Marks a single logistics notification as read for the caller.
 */
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

        if (!data?.length) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        return res.status(200).json({
            success: true,
            notification: normalizeNotificationRow(data[0]),
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update notification', error: error.message });
    }
};

/**
 * PATCH /logistics/notifications/read-all
 * Marks all unread notifications for the caller as read.
 */
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
            updatedCount: data?.length || 0,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to clear notifications', error: error.message });
    }
};

/**
 * DELETE /logistics/notifications
 * Deletes all notifications for the authenticated logistics user.
 */
export const clearNotifications = async (req, res) => {
    const recipientId = req.user?.id || req.user?.uuid;

    if (!recipientId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
        const { error } = await supabase
            .from('notifications_logistics')
            .delete()
            .eq('recipient_id', recipientId);

        if (error) throw error;

        return res.status(204).send();
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
        const [importRes, exportRes, inTransitRes, completedRes, atPortRes, pendingRes, issuesRes, activityRes] = await Promise.all([
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('order_type', 'import'),
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('order_type', 'export'),
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('current_status', 'in_transit'),
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('current_status', 'completed'),
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('current_status', 'at_port'),
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('current_status', 'pending'),
            supabase.from('issues').select(`
                issue_id, issue_type, priority, description, status, created_at, order_id,
                orders (order_reference)
            `).eq('status', 'open').order('created_at', { ascending: false }).limit(4),
            supabase.from('orders').select(`
                order_id, order_reference, order_type, current_status, created_at,
                pickup_state, destination_state, customers (customer_name),
                order_assignments (
                    vehicles (vehicle_number),
                    drivers (first_name, last_name)
                )
            `).order('created_at', { ascending: false }).limit(5)
        ]);

        res.status(200).json({
            importOrdersCount: importRes.count || 0,
            exportOrdersCount: exportRes.count || 0,
            recentIssues: (issuesRes.data || []).map(issue => ({
                issue_id: issue.issue_id,
                issue_type: issue.issue_type,
                priority: issue.priority || 'medium',
                description: issue.description,
                status: issue.status,
                created_at: issue.created_at,
                order_id: issue.order_id,
                order_reference: issue.orders?.order_reference || (issue.order_id ? `ORD-${issue.order_id}` : null)
            })),
            recentActivity: (activityRes.data || []).map(order => {
                const assignment = order.order_assignments?.[0];
                const driver = assignment?.drivers;
                const vehicle = assignment?.vehicles;

                return {
                    order_id: order.order_id,
                    order_reference: order.order_reference || `ORD-${order.order_id}`,
                    order_type: order.order_type,
                    current_status: order.current_status,
                    customer: order.customers?.customer_name || 'Internal',
                    route: order.pickup_state && order.destination_state 
                        ? `${order.pickup_state} → ${order.destination_state}` 
                        : 'Route Pending',
                    vehicle_number: vehicle?.vehicle_number || null,
                    driver_name: driver ? `${driver.first_name || ''} ${driver.last_name || ''}`.trim() : null,
                    created_at: order.created_at
                };
            }),
            stats: {
                inTransitCount: inTransitRes.count || 0,
                completedOrders: completedRes.count || 0,
                atPortCount: atPortRes.count || 0,
                pendingCount: pendingRes.count || 0
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Failed to fetch dashboard summary", error: error.message });
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

        if (req.user?.id) {
            await createLogisticsNotification({
                recipient_id: req.user.id,
                sender_id: req.user.id,
                order_id: Number(order_id),
                title: 'Tracking location updated',
                message: `Shipment tracking was updated to ${current_location || 'a new location'}.`,
                type: 'tracking',
                priority: status === 'delayed' ? 'high' : 'medium',
                action_url: `/orders/${order_id}`,
            });
        }

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
        } = req.body;

        const cleanOrderId = order_id && order_id !== "" ? parseInt(order_id, 10) : null;
        const cleanSupplierId = supplier_id && supplier_id !== "" ? parseInt(supplier_id, 10) : null;
        const cleanDriverId = driver_id && driver_id !== "" ? parseInt(driver_id, 10) : null;
        // Always the authenticated caller, never client-supplied - otherwise
        // any logistics user could attribute an issue to someone else, and
        // Admin's Issues page can't tell who actually reported it.
        const cleanReportedBy = req.user.id

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
        const { data: existingIssue, error: fetchError } = await supabase
            .from('issues')
            .select('issue_id, order_id, reported_by, status')
            .eq('issue_id', id)
            .maybeSingle();

        if (fetchError) throw fetchError;
        if (!existingIssue) {
            return res.status(404).json({
                success: false,
                message: 'Issue not found'
            });
        }

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

        const issue = data?.[0];
        const becameResolved = existingIssue.status !== 'resolved' && status === 'resolved';

        if (becameResolved && issue?.reported_by) {
            await createLogisticsNotification({
                recipient_id: issue.reported_by,
                sender_id: req.user?.id || null,
                issue_id: issue.issue_id,
                order_id: issue.order_id,
                title: 'Issue resolved',
                message: 'Your reported issue has been resolved.',
                type: 'issue',
                priority: 'medium',
                action_url: '/issues',
            });
        }

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

const getReportData = async (fromDate, toDate) => {
    if (!fromDate || !toDate || Number.isNaN(Date.parse(fromDate)) || Number.isNaN(Date.parse(toDate))) {
        throw new Error('Valid fromDate and toDate are required');
    }

    const { data: orders, error } = await supabase
        .from('orders')
        .select(`*, customers (customer_name)`)
        .gte('created_at', `${fromDate}T00:00:00Z`)
        .lte('created_at', `${toDate}T23:59:59Z`)
        .order('created_at', { ascending: false });

    if (error) throw error;

    const normalizedOrders = (orders || []).map(order => ({
        ...order,
        customer_name: order.customers?.customer_name || 'Internal'
    }));

    const total = normalizedOrders.length;
    const completedCount = normalizedOrders.filter(order => order.current_status === 'completed').length;
    const imports = normalizedOrders.filter(order => order.order_type === 'import').length;
    const exports = normalizedOrders.filter(order => order.order_type === 'export').length;

    return {
        orders: normalizedOrders,
        stats: {
            total,
            completedCount,
            imports,
            exports,
            successRate: total > 0 ? ((completedCount / total) * 100).toFixed(1) : '0'
        }
    };
};

export const getFilteredReports = async (req, res) => {
    const { fromDate, toDate } = req.query;

    try {
        res.status(200).json(await getReportData(fromDate, toDate));

    } catch (error) {
        res.status(500).json({
            message: "Failed to generate report",
            error: error.message
        });
    }
};

export const downloadReportPdf = async (req, res) => {
    const { fromDate, toDate } = req.query;

    try {
        const { orders, stats } = await getReportData(fromDate, toDate);
        const document = new PDFDocument({
            size: 'A4',
            margins: { top: 42, right: 36, bottom: 42, left: 36 },
            bufferPages: true
        });

        const safeDate = value => String(value).replace(/[^0-9-]/g, '');
        const filename = `logistics-report-${safeDate(fromDate)}-to-${safeDate(toDate)}.pdf`;

        res.status(200);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        document.pipe(res);

        const navy = '#12355B';
        const muted = '#64748B';
        const light = '#E2E8F0';
        const pageWidth = document.page.width - document.page.margins.left - document.page.margins.right;

        const drawHeader = () => {
            document.fillColor(navy).fontSize(18).font('Helvetica-Bold')
                .text('LOGISTICS OPERATIONS REPORT');
            document.fillColor(muted).fontSize(9).font('Helvetica')
                .text('ConnTrack Integrated Logistics System');
            document.moveDown(0.6);
            document.moveTo(document.page.margins.left, document.y)
                .lineTo(document.page.width - document.page.margins.right, document.y)
                .strokeColor(navy).lineWidth(1.5).stroke();
            document.moveDown(0.6);
            document.fillColor(muted).fontSize(9)
                .text(`Reporting period: ${fromDate} to ${toDate}`)
                .text(`Generated: ${new Date().toLocaleString()}`);
            document.moveDown(1);
        };

        const drawFooter = (pageNumber, pageCount) => {
            const footerY = document.page.height - 28;
            document.font('Helvetica').fontSize(8).fillColor(muted)
                .text('Confidential logistics report', document.page.margins.left, footerY, { continued: true })
                .text(`Page ${pageNumber} of ${pageCount}`, { align: 'right' });
        };

        const drawMetric = (label, value, x, y, width) => {
            document.roundedRect(x, y, width, 48, 5).fillAndStroke('#F8FAFC', light);
            document.fillColor(muted).font('Helvetica-Bold').fontSize(8).text(label.toUpperCase(), x + 10, y + 9, { width: width - 20 });
            document.fillColor(navy).font('Helvetica-Bold').fontSize(17).text(String(value), x + 10, y + 24, { width: width - 20 });
        };

        drawHeader();
        const metricGap = 8;
        const metricWidth = (pageWidth - metricGap * 3) / 4;
        const metricY = document.y;
        drawMetric('Total orders', stats.total, document.page.margins.left, metricY, metricWidth);
        drawMetric('Completed', stats.completedCount, document.page.margins.left + metricWidth + metricGap, metricY, metricWidth);
        drawMetric('Imports', stats.imports, document.page.margins.left + (metricWidth + metricGap) * 2, metricY, metricWidth);
        drawMetric('Exports', stats.exports, document.page.margins.left + (metricWidth + metricGap) * 3, metricY, metricWidth);
        document.y = metricY + 70;

        document.fillColor(navy).font('Helvetica-Bold').fontSize(12).text('Order Manifest');
        document.moveDown(0.5);

        const columns = [
            { label: 'Order ID', width: 72 },
            { label: 'Customer', width: 135 },
            { label: 'Route', width: 155 },
            { label: 'Date', width: 72 },
            { label: 'Status', width: pageWidth - 434 }
        ];
        const tableX = document.page.margins.left;
        const rowHeight = 26;
        const drawTableHeader = () => {
            let x = tableX;
            document.rect(tableX, document.y, pageWidth, rowHeight).fill(navy);
            columns.forEach(column => {
                document.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8).text(column.label, x + 5, document.y + 9, { width: column.width - 10 });
                x += column.width;
            });
            document.y += rowHeight;
        };

        drawTableHeader();
        orders.forEach((order, index) => {
            if (document.y > document.page.height - document.page.margins.bottom - 45) {
                document.addPage();
                drawHeader();
                drawTableHeader();
            }

            const rowY = document.y;
            if (index % 2 === 0) document.rect(tableX, rowY, pageWidth, rowHeight).fill('#F8FAFC');
            document.rect(tableX, rowY, pageWidth, rowHeight).strokeColor(light).lineWidth(0.5).stroke();
            const route = order.route || `${order.pickup_location || order.pickup_district || 'N/A'} -> ${order.destination_location || order.destination_district || 'N/A'}`;
            const values = [
                `#${String(order.order_id).padStart(5, '0')}`,
                order.customer_name || 'Unknown Customer',
                route,
                order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A',
                (order.current_status || 'created').replace(/_/g, ' ')
            ];
            let x = tableX;
            values.forEach((value, valueIndex) => {
                document.fillColor('#1E293B').font('Helvetica').fontSize(8).text(String(value), x + 5, rowY + 9, { width: columns[valueIndex].width - 10, height: rowHeight - 10, ellipsis: true });
                x += columns[valueIndex].width;
            });
            document.y = rowY + rowHeight;
        });

        const range = document.bufferedPageRange();
        for (let index = range.start; index < range.start + range.count; index += 1) {
            document.switchToPage(index);
            drawFooter(index + 1, range.count);
        }

        document.end();
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to generate report PDF', error: error.message });
        }
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

        const notificationRecipient = uploaded_by && uploaded_by !== 'temp-user-id'
            ? uploaded_by
            : req.user?.id;
        if (notificationRecipient) {
            await createLogisticsNotification({
                recipient_id: notificationRecipient,
                sender_id: req.user?.id || null,
                order_id: Number(order_id),
                title: 'Documents uploaded',
                message: `${uploadedDocuments.length} document${uploadedDocuments.length === 1 ? '' : 's'} uploaded successfully.`,
                type: 'document',
                priority: 'medium',
                action_url: `/orders/${order_id}`,
            });
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
            .select('file_url, order_id, document_name')
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

        if (req.user?.id) {
            await createLogisticsNotification({
                recipient_id: req.user.id,
                sender_id: req.user.id,
                order_id: doc.order_id ? Number(doc.order_id) : null,
                title: 'Document removed',
                message: `Document "${doc.document_name || 'clearance document'}" was deleted.`,
                type: 'document',
                priority: 'low',
                action_url: doc.order_id ? `/orders/${doc.order_id}` : '/orders',
            });
        }

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


// -----------------------------------------------------------------------------
// BIDS
// -----------------------------------------------------------------------------
// These endpoints supply supplier bids for a logistics order so the user can
// compare offers and finalize the assignment.
export const getShortlistedBids = async (req, res) => {
    const { orderId } = req.params;

    try {
        // Load the shortlist sent by Operations. After Logistics finalizes a
        // winner, only the accepted row is returned so the UI can restore the
        // finalized state on refresh.
        const { data: selections, error: selectionError } = await supabase
            .from('bid_selection')
            .select(`
                selection_id,
                order_id,
                bid_id,
                supplier_id,
                selection_status,
                sent_to_logistics,
                selected
            `)
            .eq('order_id', Number(orderId))
            .eq('sent_to_logistics', true)
            .in('selection_status', ['shortlisted', 'accepted'])
            .order('selection_id', { ascending: true });

        if (selectionError) throw selectionError;

        if (!selections?.length) {
            return res.status(200).json([]);
        }

        const bidIds = selections
            .map((item) => item.bid_id)
            .filter(Boolean);

        const supplierIds = selections
            .map((item) => item.supplier_id)
            .filter(Boolean);

        const [{ data: bidRows, error: bidError }, { data: supplierRows, error: supplierError }] =
            await Promise.all([
                supabase
                    .from('bids')
                    .select('bid_id, supplier_id, bid_amount, eta, bid_status')
                    .in('bid_id', bidIds),
                supplierIds.length
                    ? supabase
                        .from('suppliers')
                        .select('supplier_id, company_name, rating')
                        .in('supplier_id', supplierIds)
                    : Promise.resolve({ data: [], error: null }),
            ]);

        if (bidError) throw bidError;
        if (supplierError) throw supplierError;

        const bidById = new Map((bidRows || []).map((bid) => [bid.bid_id, bid]));
        const supplierById = new Map(
            (supplierRows || []).map((supplier) => [supplier.supplier_id, supplier])
        );

        const formatted = selections.map((item) => {
            const bid = bidById.get(item.bid_id);
            const supplier = supplierById.get(item.supplier_id || bid?.supplier_id);

            return {
                id: item.bid_id,
                selectionId: item.selection_id,
                selectionStatus: item.selection_status,
                selected: Boolean(item.selected),
                supplierId: item.supplier_id || bid?.supplier_id || null,
                supplierName: supplier?.company_name || 'Unknown Carrier',
                amount: bid?.bid_amount ?? null,
                rating: supplier?.rating ?? 0,
                eta: bid?.eta || 'N/A',
                bidStatus: bid?.bid_status || null,
            };
        });

        return res.status(200).json(formatted);
    } catch (error) {
        return res.status(500).json({
            message: 'Error retrieving bids',
            error: error.message,
        });
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
    const userId = req.user?.id || null;

    if (!selectionId || !bidId) {
        return res.status(400).json({
            success: false,
            message: 'selectionId and bidId are required',
        });
    }

    try {
        // 1. Confirm that the selected row really belongs to this order and was
        // sent by Operations to Logistics.
        const { data: selectedSelection, error: selectionFetchError } = await supabase
            .from('bid_selection')
            .select(`
                selection_id,
                order_id,
                bid_id,
                supplier_id,
                selection_status,
                sent_to_logistics,
                selected
            `)
            .eq('selection_id', Number(selectionId))
            .eq('order_id', Number(orderId))
            .eq('bid_id', Number(bidId))
            .eq('sent_to_logistics', true)
            .maybeSingle();

        if (selectionFetchError) throw selectionFetchError;

        if (!selectedSelection) {
            return res.status(404).json({
                success: false,
                message: 'Selected shortlisted bid was not found for this order',
            });
        }

        // 2. Load the order and winning bid details needed for the response and
        // Operations notification.
        const [orderResult, bidResult] = await Promise.all([
            supabase
                .from('orders')
                .select('order_id, order_reference')
                .eq('order_id', Number(orderId))
                .maybeSingle(),
            supabase
                .from('bids')
                .select('bid_id, supplier_id, bid_amount, bidding_id')
                .eq('bid_id', Number(bidId))
                .maybeSingle(),
        ]);

        if (orderResult.error) throw orderResult.error;
        if (bidResult.error) throw bidResult.error;

        const orderData = orderResult.data;
        const winningBid = bidResult.data;

        if (!winningBid) {
            return res.status(404).json({
                success: false,
                message: 'Winning bid record was not found',
            });
        }

        const orderRef = orderData?.order_reference || `Order #${orderId}`;

        // 3. Mark exactly one shortlist row as the Logistics winner.
        const { error: winnerSelectionError } = await supabase
            .from('bid_selection')
            .update({
                selection_status: 'accepted',
                selected: true,
                selected_by: userId,
                selected_at: new Date().toISOString(),
            })
            .eq('selection_id', Number(selectionId))
            .eq('order_id', Number(orderId));

        if (winnerSelectionError) throw winnerSelectionError;

        // 4. Reject only the other rows that were in the shortlist sent to
        // Logistics for this order.
        const { data: losingSelections, error: loserSelectionError } = await supabase
            .from('bid_selection')
            .update({
                selection_status: 'rejected',
                selected: false,
            })
            .eq('order_id', Number(orderId))
            .eq('sent_to_logistics', true)
            .eq('selection_status', 'shortlisted')
            .neq('selection_id', Number(selectionId))
            .select('selection_id, bid_id, supplier_id');

        if (loserSelectionError) throw loserSelectionError;

        // 5. Keep the bids table consistent with the selection result.
        const { error: winnerBidError } = await supabase
            .from('bids')
            .update({ bid_status: 'accepted' })
            .eq('bid_id', Number(bidId));

        if (winnerBidError) throw winnerBidError;

        const losingBidIds = (losingSelections || [])
            .map((item) => item.bid_id)
            .filter(Boolean);

        if (losingBidIds.length) {
            const { error: losingBidError } = await supabase
                .from('bids')
                .update({ bid_status: 'rejected' })
                .in('bid_id', losingBidIds);

            if (losingBidError) throw losingBidError;
        }

        // 6. Update the order only to indicate that Logistics selected a bid.
        // Driver assignment and supplier-response handling remain later steps in
        // the existing Operations/Supplier workflow.
        const { error: orderStatusError } = await supabase
            .from('orders')
            .update({ current_status: 'bid_accepted' })
            .eq('order_id', Number(orderId));

        if (orderStatusError) throw orderStatusError;

        // 7. Notify Operations that Logistics selected the winner. This does not
        // mean the supplier has accepted the award yet.
        const notificationInsert = {
            event_type: 'logistics_winner_selected',
            source_role: 'logistics',
            order_id: Number(orderId),
            order_reference: orderData?.order_reference || null,
            issue_id: null,
            title: 'Winner Selected by Logistics',
            message: `Logistics selected the winning bid for ${orderRef}.`,
            is_read: false,
            read_at: null,
            dedupe_key: `logistics-winner-selected:${orderId}:${bidId}`,
            metadata: {
                selection_id: Number(selectionId),
                bid_id: Number(bidId),
                supplier_id: winningBid.supplier_id || selectedSelection.supplier_id || null,
            },
            created_at: new Date().toISOString(),
        };

        const { error: notificationError } = await supabase
            .from('notification_operations')
            .upsert(notificationInsert, { onConflict: 'dedupe_key' });

        if (notificationError) {
            // Winner selection must remain successful even if a notification
            // cannot be written. Log the notification problem for follow-up.
            console.error('Failed to create Operations winner notification:', notificationError);
        }

        if (req.user?.id) {
            try {
                await createLogisticsNotification({
                    recipient_id: req.user.id,
                    sender_id: req.user.id,
                    order_id: Number(orderId),
                    title: 'Supplier bid finalized',
                    message: `Winning bid has been selected for ${orderRef}.`,
                    type: 'order',
                    priority: 'medium',
                    action_url: `/orders/${orderId}`,
                });
            } catch (err) {
                console.error('Failed to create Logistics winner notification:', err);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Winning supplier selected successfully.',
            winner: {
                orderId: Number(orderId),
                orderReference: orderData?.order_reference || null,
                selectionId: Number(selectionId),
                bidId: Number(bidId),
                supplierId: winningBid.supplier_id || selectedSelection.supplier_id || null,
                bidAmount: winningBid.bid_amount ?? null,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Finalize failed',
            error: error.message,
        });
    }
};