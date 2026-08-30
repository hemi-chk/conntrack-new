import { supabase } from '@conntrack/database';

export const normalizeNotificationRow = (row = {}) => ({
    id: row.id,
    title: row.title || 'System update',
    message: row.message || 'New update available.',
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

export const getUnreadNotificationsCount = async (recipientId) => {
    if (!recipientId) return 0;

    const { count, error } = await supabase
        .from('notifications_logistics')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', recipientId)
        .eq('is_read', false);

    if (error) throw error;
    return count || 0;
};
