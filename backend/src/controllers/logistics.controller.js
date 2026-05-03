import { supabase } from '../config/supabase.js';

export const getDashboardSummary = async (req, res) => {
    try {
        // 1. Fetch exact counts for Import/Export
        const { count: importCount, error: importErr } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('order_type', 'import');

        const { count: exportCount, error: exportErr } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('order_type', 'export');

        // 2. Fetch Pending Requests 
        // These are orders created but not yet assigned to a supplier
        const { count: pendingCount, error: pendingErr } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .in('current_status', ['created', 'open_for_bids']);

        // 3. Fetch Active Issues (Unresolved)
        const { count: issuesCount, error: issuesErr } = await supabase
            .from('issues')
            .select('*', { count: 'exact', head: true })
            .neq('status', 'resolved');

        // 4. Fetch Recent Activity with Customer Information
        const { data: recentActivity, error: activityErr } = await supabase
            .from('orders')
            .select(`
                order_id,
                order_reference,
                order_type,
                current_status,
                created_at,
                pickup_state,
                destination_state,
                customers (customer_name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        if (importErr || exportErr || activityErr || pendingErr || issuesErr) {
            throw new Error("One or more Supabase queries failed");
        }

        // 5. Structure the standardized response
        const summaryData = {
            importOrdersCount: importCount || 0,
            exportOrdersCount: exportCount || 0,
            recentActivity: (recentActivity || []).map(order => ({
                order_id: order.order_id,
                order_reference: order.order_reference || `ORD-${order.order_id}`,
                order_type: order.order_type,
                current_status: order.current_status,
                customer: order.customers?.customer_name || 'Internal',
                route: `${order.pickup_state} → ${order.destination_state}`,
                created_at: order.created_at
            })),
            stats: {
                pendingRequests: pendingCount || 0,
                clearanceIssues: issuesCount || 0
            }
        };

        res.status(200).json(summaryData);
    } catch (error) {
        console.error("Dashboard Summary Error:", error);
        res.status(500).json({
            message: "Failed to fetch dashboard summary",
            error: error.message
        });
    }
}

export const getOrdersByType = async (req, res) => {
    const { type } = req.query;

    try {
        // Fetch detailed order info including Customer and Bid counts
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                customers (customer_name),
                bids (count)
            `)
            .eq('order_type', type)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map the relational data into a flat object for the frontend table
        const formattedOrders = data.map(order => ({
            ...order,
            customer_name: order.customers?.customer_name || 'N/A',
            bid_count: order.bids?.[0]?.count || 0,
            // Construct a readable route string
            route: `${order.pickup_state}, ${order.pickup_country} to ${order.destination_state}, ${order.destination_country}`
        }));

        res.status(200).json(formattedOrders);
    } catch (error) {
        console.error("Fetch Orders Error:", error);
        res.status(500).json({
            message: "Error retrieving orders",
            error: error.message
        });
    }
};