import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()
const TABLE = 'notification_operations'

function isMissingColumnError(error) {
  if (!error) return false

  const message = String(error.message || '').toLowerCase()
  const code = String(error.code || '')

  return (
    code === '42703' ||
    message.includes('column') ||
    message.includes('does not exist')
  )
}

async function updateNotificationById(notificationId, values) {
  const possibleIdColumns = ['id', 'notification_id']
  let lastError = null

  for (const column of possibleIdColumns) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(values)
      .eq(column, notificationId)
      .select()

    if (!error) {
      return { data: data || [], error: null }
    }

    lastError = error

    if (!isMissingColumnError(error)) {
      break
    }
  }

  return { data: [], error: lastError }
}

async function deleteNotificationById(notificationId) {
  const possibleIdColumns = ['id', 'notification_id']
  let lastError = null

  for (const column of possibleIdColumns) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq(column, notificationId)
      .select()

    if (!error) {
      return { data: data || [], error: null }
    }

    lastError = error

    if (!isMissingColumnError(error)) {
      break
    }
  }

  return { data: [], error: lastError }
}

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const notifications = data || []
    const unreadCount = notifications.filter(
      (notification) => !notification.is_read
    ).length

    return res.status(200).json({
      success: true,
      unread_count: unreadCount,
      notifications,
    })
  } catch (error) {
    console.error('GET operations notifications error:', error)

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to load Operations notifications.',
    })
  }
})

router.patch('/read-all', async (req, res) => {
  try {
    const readAt = new Date().toISOString()

    const { data, error } = await supabase
      .from(TABLE)
      .update({
        is_read: true,
        read_at: readAt,
      })
      .eq('is_read', false)
      .select()

    if (error) throw error

    return res.status(200).json({
      success: true,
      updated_count: (data || []).length,
      notifications: data || [],
    })
  } catch (error) {
    console.error(
      'PATCH read-all operations notifications error:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to mark all notifications as read.',
    })
  }
})

router.patch('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params

    const { data, error } = await updateNotificationById(
      notificationId,
      {
        is_read: true,
        read_at: new Date().toISOString(),
      }
    )

    if (error) throw error

    if (!data.length) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      })
    }

    return res.status(200).json({
      success: true,
      notification: data[0],
    })
  } catch (error) {
    console.error(
      'PATCH one Operations notification error:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to mark notification as read.',
    })
  }
})

router.delete('/read', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('is_read', true)
      .select()

    if (error) throw error

    return res.status(200).json({
      success: true,
      deleted_count: (data || []).length,
    })
  } catch (error) {
    console.error(
      'DELETE read Operations notifications error:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to clear checked notifications.',
    })
  }
})

router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params

    const { data, error } = await deleteNotificationById(
      notificationId
    )

    if (error) throw error

    if (!data.length) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      })
    }

    return res.status(200).json({
      success: true,
      deleted_notification: data[0],
    })
  } catch (error) {
    console.error(
      'DELETE one Operations notification error:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to remove notification.',
    })
  }
})

export default router
