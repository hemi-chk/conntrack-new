import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

const TABLE = 'notification_operations'

const ALLOWED_SOURCE_ROLES = [
  'admin',
]

const ALLOWED_EVENT_TYPES = [
  'admin_issue_status_changed',
]

function isMissingColumnError(error) {
  if (!error) {
    return false
  }

  const message = String(
    error.message || ''
  ).toLowerCase()

  const code = String(
    error.code || ''
  )

  return (
    code === '42703' ||
    message.includes('column') ||
    message.includes('does not exist')
  )
}

async function updateNotificationById(
  notificationId,
  values
) {
  const possibleIdColumns = [
    'id',
    'notification_id',
  ]

  let lastError = null

  for (const column of possibleIdColumns) {
    let query = supabase
      .from(TABLE)
      .update(values)
      .eq(column, notificationId)
      .in(
        'source_role',
        ALLOWED_SOURCE_ROLES
      )
      .in(
        'event_type',
        ALLOWED_EVENT_TYPES
      )
      .select()

    const {
      data,
      error,
    } = await query

    if (!error) {
      return {
        data: data || [],
        error: null,
      }
    }

    lastError = error

    if (!isMissingColumnError(error)) {
      break
    }
  }

  return {
    data: [],
    error: lastError,
  }
}

async function deleteNotificationById(
  notificationId
) {
  const possibleIdColumns = [
    'id',
    'notification_id',
  ]

  let lastError = null

  for (const column of possibleIdColumns) {
    const {
      data,
      error,
    } = await supabase
      .from(TABLE)
      .delete()
      .eq(column, notificationId)
      .in(
        'source_role',
        ALLOWED_SOURCE_ROLES
      )
      .in(
        'event_type',
        ALLOWED_EVENT_TYPES
      )
      .select()

    if (!error) {
      return {
        data: data || [],
        error: null,
      }
    }

    lastError = error

    if (!isMissingColumnError(error)) {
      break
    }
  }

  return {
    data: [],
    error: lastError,
  }
}

// ============================================================
// GET OPERATIONS NOTIFICATIONS
//
// Only incoming notifications are shown:
//
// Admin:
//   - admin_issue_status_changed
// ============================================================

router.get('/', async (req, res) => {
  try {
    const {
      data,
      error,
    } = await supabase
      .from(TABLE)
      .select('*')
      .in(
        'source_role',
        ALLOWED_SOURCE_ROLES
      )
      .in(
        'event_type',
        ALLOWED_EVENT_TYPES
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      )
      .limit(100)

    if (error) {
      throw error
    }

    const notifications =
      data || []

    const unreadCount =
      notifications.filter(
        (notification) =>
          !notification.is_read
      ).length

    return res.status(200).json({
      success: true,
      unread_count: unreadCount,
      notifications,
    })
  } catch (error) {
    console.error(
      'GET operations notifications error:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to load Operations notifications.',
    })
  }
})

// ============================================================
// MARK ONE NOTIFICATION AS READ
// ============================================================

router.patch(
  '/:notificationId/read',
  async (req, res) => {
    try {
      const {
        notificationId,
      } = req.params

      const {
        data,
        error,
      } =
        await updateNotificationById(
          notificationId,
          {
            is_read: true,
          }
        )

      if (error) {
        throw error
      }

      if (!data.length) {
        return res.status(404).json({
          success: false,
          message:
            'Notification not found.',
        })
      }

      return res.status(200).json({
        success: true,
        notification: data[0],
      })
    } catch (error) {
      console.error(
        'MARK notification read error:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Failed to mark notification as read.',
      })
    }
  }
)

// ============================================================
// MARK ALL INCOMING NOTIFICATIONS AS READ
// ============================================================

router.patch(
  '/read-all',
  async (req, res) => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from(TABLE)
        .update({
          is_read: true,
        })
        .in(
          'source_role',
          ALLOWED_SOURCE_ROLES
        )
        .in(
          'event_type',
          ALLOWED_EVENT_TYPES
        )
        .eq(
          'is_read',
          false
        )
        .select()

      if (error) {
        throw error
      }

      return res.status(200).json({
        success: true,
        updated_count:
          data?.length || 0,
      })
    } catch (error) {
      console.error(
        'MARK ALL notifications read error:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Failed to mark notifications as read.',
      })
    }
  }
)

// ============================================================
// DELETE ONE INCOMING NOTIFICATION
// ============================================================

// ============================================================
// DELETE ALL READ INCOMING NOTIFICATIONS
// ============================================================

router.delete(
  '/read',
  async (req, res) => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from(TABLE)
        .delete()
        .eq(
          'is_read',
          true
        )
        .in(
          'source_role',
          ALLOWED_SOURCE_ROLES
        )
        .in(
          'event_type',
          ALLOWED_EVENT_TYPES
        )
        .select()

      if (error) {
        throw error
      }

      return res.status(200).json({
        success: true,
        deleted_count:
          data?.length || 0,
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
          'Failed to clear read notifications.',
      })
    }
  }
)
router.delete(
  '/:notificationId',
  async (req, res) => {
    try {
      const {
        notificationId,
      } = req.params

      const {
        data,
        error,
      } =
        await deleteNotificationById(
          notificationId
        )

      if (error) {
        throw error
      }

      if (!data.length) {
        return res.status(404).json({
          success: false,
          message:
            'Notification not found.',
        })
      }

      return res.status(200).json({
        success: true,
        message:
          'Notification deleted successfully.',
      })
    } catch (error) {
      console.error(
        'DELETE notification error:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Failed to delete notification.',
      })
    }
  }
)

export default router

